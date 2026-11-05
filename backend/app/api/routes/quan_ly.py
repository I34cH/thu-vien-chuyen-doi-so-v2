"""Thủ thư (thu_thu, admin): quản lý mượn trả, tải bản mềm, danh sách tư liệu, mã vấn đề, nhãn chủ đề."""
import math
import time
from typing import Literal

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import yeu_cau_vai_tro
from app.core.config import settings
from app.db.session import get_db
from app.models import NguoiDung
from app.schemas.yeu_cau import ChuDeVao, MaVanDeVao
from app.services import ban_mem as dv_ban_mem
from app.services.muon import SELECT_LUOT_MUON, lay_luot_muon, luot_muon_json
from app.services.tai_lieu import COT_TOM_TAT, JOIN_TINH_TRANG, chi_tiet, tom_tat

router = APIRouter(prefix="/quan-ly")

TOI_DA_BYTE = 20 * 1024 * 1024
LOC_Q_MUON = (
    "(CAST(:q AS text) IS NULL OR strpos(lower(f_unaccent(u.ho_ten || ' ' || u.ten_dang_nhap || ' ' || "
    "t.ky_hieu || ' ' || t.tieu_de)), f_chuan_hoa(:q)) > 0)"
)
LOC_TRANG_THAI = {
    None: "TRUE",
    "cho_duyet": "m.trang_thai = 'cho_duyet'",
    "dang_muon": "m.trang_thai = 'dang_muon'",
    "da_tra": "m.trang_thai = 'da_tra'",
    "tu_choi": "m.trang_thai = 'tu_choi'",
    "qua_han": "(m.trang_thai = 'dang_muon' AND m.han_tra < CURRENT_DATE)",
}
TU_THU = Depends(yeu_cau_vai_tro("thu_thu"))


@router.get("/muon")
def danh_sach_muon(
    trang_thai: Literal["cho_duyet", "dang_muon", "da_tra", "tu_choi", "qua_han"] | None = None,
    q: str | None = None,
    trang: int = Query(1, ge=1),
    kich_thuoc: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _=TU_THU,
):
    tham_so = {"q": (q or "").replace("\0", "").strip()[:200] or None}
    nguon = "FROM luot_muon m JOIN tai_lieu t ON t.id = m.tai_lieu_id JOIN nguoi_dung u ON u.id = m.nguoi_dung_id"
    loc = LOC_TRANG_THAI[trang_thai]
    tong_so = db.execute(text(f"SELECT count(*)::int {nguon} WHERE {LOC_Q_MUON} AND {loc}"), tham_so).scalar_one()
    dem = db.execute(
        text(
            f"""SELECT count(*) FILTER (WHERE m.trang_thai = 'cho_duyet')::int AS cho_duyet,
                       count(*) FILTER (WHERE m.trang_thai = 'dang_muon')::int AS dang_muon,
                       count(*) FILTER (WHERE m.trang_thai = 'dang_muon' AND m.han_tra < CURRENT_DATE)::int AS qua_han,
                       count(*) FILTER (WHERE m.trang_thai = 'da_tra')::int AS da_tra,
                       count(*) FILTER (WHERE m.trang_thai = 'tu_choi')::int AS tu_choi
                {nguon} WHERE {LOC_Q_MUON}"""
        ),
        tham_so,
    ).one()
    dong = db.execute(
        text(
            f"""{SELECT_LUOT_MUON} WHERE {LOC_Q_MUON} AND {loc}
                ORDER BY m.ngay_dang_ky DESC, m.id DESC OFFSET :bo_qua LIMIT :gh"""
        ),
        {**tham_so, "bo_qua": (trang - 1) * kich_thuoc, "gh": kich_thuoc},
    ).all()
    return {
        "du_lieu": [luot_muon_json(r, kem_nguoi_dung=True) for r in dong],
        "tong_so": tong_so,
        "trang": trang,
        "kich_thuoc": kich_thuoc,
        "tong_trang": max(1, math.ceil(tong_so / kich_thuoc)),
        "dem": dict(dem._mapping),
    }


def _khoa_luot_muon(db: Session, luot_muon_id: int):
    """Khóa dòng lượt mượn (FOR UPDATE) trong transaction hiện tại; 404 nếu không có."""
    luot = db.execute(
        text("SELECT id, tai_lieu_id, ban_sao_id, trang_thai FROM luot_muon WHERE id = :id FOR UPDATE"),
        {"id": luot_muon_id},
    ).first()
    if luot is None:
        db.rollback()
        raise HTTPException(status_code=404, detail="Không tìm thấy lượt mượn.")
    return luot


@router.post("/muon/{luot_muon_id}/duyet")
def duyet_muon(luot_muon_id: int, db: Session = Depends(get_db), _=TU_THU):
    """Duyệt trong transaction: khóa lượt mượn, khóa một bản sao còn rảnh, gán và đặt hạn trả +14 ngày."""
    luot = _khoa_luot_muon(db, luot_muon_id)
    if luot.trang_thai != "cho_duyet":
        db.rollback()
        raise HTTPException(status_code=409, detail=f"Lượt mượn không ở trạng thái chờ duyệt ({luot.trang_thai}).")
    ban_sao = db.execute(
        text(
            """SELECT id FROM ban_sao WHERE tai_lieu_id = :tl AND trang_thai = 'con'
               ORDER BY id LIMIT 1 FOR UPDATE"""
        ),
        {"tl": luot.tai_lieu_id},
    ).first()
    if ban_sao is None:
        db.rollback()
        raise HTTPException(status_code=409, detail="Không còn bản sao khả dụng để cho mượn.")
    db.execute(text("UPDATE ban_sao SET trang_thai = 'dang_muon' WHERE id = :id"), {"id": ban_sao.id})
    db.execute(
        text(
            """UPDATE luot_muon SET ban_sao_id = :bs, trang_thai = 'dang_muon', ngay_muon = CURRENT_DATE,
                      han_tra = CURRENT_DATE + 14 WHERE id = :id"""
        ),
        {"bs": ban_sao.id, "id": luot_muon_id},
    )
    db.commit()
    return lay_luot_muon(db, luot_muon_id, kem_nguoi_dung=True)


@router.post("/muon/{luot_muon_id}/tu-choi")
def tu_choi_muon(luot_muon_id: int, db: Session = Depends(get_db), _=TU_THU):
    luot = _khoa_luot_muon(db, luot_muon_id)
    if luot.trang_thai != "cho_duyet":
        db.rollback()
        raise HTTPException(status_code=409, detail=f"Không thể từ chối lượt mượn ở trạng thái {luot.trang_thai}.")
    db.execute(text("UPDATE luot_muon SET trang_thai = 'tu_choi' WHERE id = :id"), {"id": luot_muon_id})
    db.commit()
    return lay_luot_muon(db, luot_muon_id, kem_nguoi_dung=True)


@router.post("/muon/{luot_muon_id}/tra")
def tra_muon(luot_muon_id: int, db: Session = Depends(get_db), _=TU_THU):
    luot = _khoa_luot_muon(db, luot_muon_id)
    if luot.trang_thai != "dang_muon":
        db.rollback()
        raise HTTPException(status_code=409, detail=f"Lượt mượn không ở trạng thái đang mượn ({luot.trang_thai}).")
    if luot.ban_sao_id:
        db.execute(text("UPDATE ban_sao SET trang_thai = 'con' WHERE id = :id"), {"id": luot.ban_sao_id})
    db.execute(
        text("UPDATE luot_muon SET trang_thai = 'da_tra', ngay_tra = CURRENT_DATE WHERE id = :id"),
        {"id": luot_muon_id},
    )
    db.commit()
    return lay_luot_muon(db, luot_muon_id, kem_nguoi_dung=True)


@router.post("/tai-lieu/{tai_lieu_id}/ban-mem")
def tai_len_ban_mem(
    tai_lieu_id: int,
    file: UploadFile = File(...),
    muc_truy_cap: Literal["cong_khai", "noi_bo"] = Form("cong_khai"),
    db: Session = Depends(get_db),
    nd: NguoiDung = TU_THU,
):
    """Tải PDF (≤ 20MB, đuôi .pdf, Content-Type PDF, 4 byte đầu là %PDF) và đánh dấu đã số hóa."""
    ten = (file.filename or "").lower()
    if not ten.endswith(".pdf") or file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Chỉ chấp nhận tệp định dạng PDF.")
    noi_dung = file.file.read(TOI_DA_BYTE + 1)
    if len(noi_dung) > TOI_DA_BYTE:
        raise HTTPException(status_code=400, detail="Tệp vượt quá dung lượng tối đa 20MB.")
    if noi_dung[:4] != b"%PDF":
        raise HTTPException(status_code=400, detail="Tệp tải lên không phải PDF hợp lệ (thiếu tiêu đề %PDF).")
    tl = db.execute(
        text("SELECT id, duong_dan_ban_mem FROM tai_lieu WHERE id = :id"), {"id": tai_lieu_id}
    ).first()
    if tl is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy tư liệu.")

    thu_muc = settings.thu_muc_ban_mem
    thu_muc.mkdir(parents=True, exist_ok=True)
    ten_moi = f"tl_{tai_lieu_id}_{int(time.time() * 1000)}.pdf"
    (thu_muc / ten_moi).write_bytes(noi_dung)
    db.execute(
        text(
            """UPDATE tai_lieu SET co_ban_mem = true, muc_truy_cap = :muc, duong_dan_ban_mem = :dd
               WHERE id = :id"""
        ),
        {"muc": muc_truy_cap, "dd": ten_moi, "id": tai_lieu_id},
    )
    db.commit()
    dv_ban_mem.xoa_tep_tu_tai_len(tl.duong_dan_ban_mem)  # dọn tệp cũ khi tải đè
    return chi_tiet(db, tai_lieu_id, nd.id)


@router.get("/tai-lieu")
def danh_sach_tai_lieu(
    q: str | None = None,
    trang: int = Query(1, ge=1),
    kich_thuoc: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _=TU_THU,
):
    """Danh sách tư liệu cho thủ thư; tìm theo tiêu đề/tác giả hoặc tiền tố ký hiệu. Không ghi log."""
    q = (q or "").replace("\0", "").strip()[:200]
    if q:
        nguon = (
            f"FROM tai_lieu t {JOIN_TINH_TRANG} LEFT JOIN tim_tai_lieu(:q) s ON s.tai_lieu_id = t.id "
            "WHERE s.tai_lieu_id IS NOT NULL OR starts_with(lower(t.ky_hieu), lower(:q))"
        )
        thu_tu = "coalesce(s.diem, 10) DESC, t.id"
    else:
        nguon = f"FROM tai_lieu t {JOIN_TINH_TRANG}"
        thu_tu = "t.id"
    tong_so = db.execute(text(f"SELECT count(*)::int {nguon}"), {"q": q}).scalar_one()
    dong = db.execute(
        text(f"SELECT {COT_TOM_TAT} {nguon} ORDER BY {thu_tu} OFFSET :bo_qua LIMIT :gh"),
        {"q": q, "bo_qua": (trang - 1) * kich_thuoc, "gh": kich_thuoc},
    ).all()
    return {
        "du_lieu": [tom_tat(r) for r in dong],
        "tong_so": tong_so,
        "trang": trang,
        "kich_thuoc": kich_thuoc,
        "tong_trang": max(1, math.ceil(tong_so / kich_thuoc)),
    }


@router.get("/ma-van-de")
def ds_ma_van_de(db: Session = Depends(get_db), _=TU_THU):
    return [
        {"ma": r.ma, "ten": r.ten, "so_tai_lieu": r.so_tai_lieu}
        for r in db.execute(
            text(
                """SELECT m.ma, m.ten, count(t.id)::int AS so_tai_lieu
                   FROM ma_van_de m LEFT JOIN tai_lieu t ON t.ma_van_de = m.ma
                   GROUP BY m.ma, m.ten ORDER BY so_tai_lieu DESC, m.ma"""
            )
        )
    ]


@router.put("/ma-van-de")
def cap_nhat_ma_van_de(vao: MaVanDeVao, db: Session = Depends(get_db), _=TU_THU):
    ten = (vao.ten or "").strip() or None
    dong = db.execute(
        text("UPDATE ma_van_de SET ten = :ten WHERE ma = :ma RETURNING ma, ten"), {"ten": ten, "ma": vao.ma}
    ).first()
    if dong is None:
        db.rollback()
        raise HTTPException(status_code=404, detail="Không có mã vấn đề này.")
    db.commit()
    so = db.execute(
        text("SELECT count(*)::int FROM tai_lieu WHERE ma_van_de = :ma"), {"ma": vao.ma}
    ).scalar_one()
    return {"ma": dong.ma, "ten": dong.ten, "so_tai_lieu": so}


# ---- Chủ đề (gom cụm TF-IDF ở pipeline.tuong_tu): thủ thư sửa nhãn tự động cho dễ đọc ----
# Nhãn sửa tay lưu thêm vào chu_de_nhan_tay theo chữ ký cụm (chu_de.khoa) để pipeline.reset/pipeline.tuong_tu áp lại.
SELECT_CHU_DE = """SELECT c.id, c.nhan, c.nhan_tu_dong, c.da_sua_tay, c.khoa, c.tu_khoa_noi_bat,
                          count(t.id)::int AS so_tai_lieu
                   FROM chu_de c LEFT JOIN tai_lieu t ON t.chu_de_id = c.id"""


def _chu_de_json(r) -> dict:
    return {
        "id": r.id, "nhan": r.nhan, "nhan_tu_dong": r.nhan_tu_dong or r.nhan, "da_sua_tay": bool(r.da_sua_tay),
        "tu_khoa_noi_bat": list(r.tu_khoa_noi_bat or []), "so_tai_lieu": r.so_tai_lieu,
    }


def _mot_chu_de(db: Session, chu_de_id: int) -> dict:
    return _chu_de_json(db.execute(text(f"{SELECT_CHU_DE} WHERE c.id = :id GROUP BY c.id"), {"id": chu_de_id}).one())


def _dat_nhan(db: Session, chu_de_id: int, nhan: str, sua_tay: bool) -> dict:
    """Đặt nhãn (tay hoặc khôi phục tự động) và đồng bộ chu_de_nhan_tay. 404 không có, 409 trùng nhãn chủ đề khác."""
    cd = db.execute(
        text("SELECT id, khoa, tu_khoa_noi_bat FROM chu_de WHERE id = :id"), {"id": chu_de_id}
    ).first()
    if cd is None:
        raise HTTPException(status_code=404, detail="Không có chủ đề này.")
    trung = db.execute(
        text("SELECT 1 FROM chu_de WHERE lower(nhan) = lower(:nhan) AND id <> :id"), {"nhan": nhan, "id": chu_de_id}
    ).first()
    if trung:
        raise HTTPException(status_code=409, detail="Đã có chủ đề khác mang nhãn này.")
    db.execute(
        text("UPDATE chu_de SET nhan = :nhan, da_sua_tay = :tay WHERE id = :id"),
        {"nhan": nhan, "tay": sua_tay, "id": chu_de_id},
    )
    if cd.khoa:
        if sua_tay:
            db.execute(
                text("""INSERT INTO chu_de_nhan_tay (khoa, tu_khoa, nhan) VALUES (:k, :tk, :nhan)
                        ON CONFLICT (khoa) DO UPDATE SET nhan = EXCLUDED.nhan, tu_khoa = EXCLUDED.tu_khoa,
                                                         cap_nhat = now()"""),
                {"k": cd.khoa, "tk": list(cd.tu_khoa_noi_bat or []), "nhan": nhan},
            )
        else:
            db.execute(text("DELETE FROM chu_de_nhan_tay WHERE khoa = :k"), {"k": cd.khoa})
    db.commit()
    return _mot_chu_de(db, chu_de_id)


@router.get("/chu-de")
def ds_chu_de(db: Session = Depends(get_db), _=TU_THU):
    return [
        _chu_de_json(r)
        for r in db.execute(text(f"{SELECT_CHU_DE} GROUP BY c.id ORDER BY so_tai_lieu DESC, c.id"))
    ]


@router.put("/chu-de/{chu_de_id}")
def cap_nhat_chu_de(chu_de_id: int, vao: ChuDeVao, db: Session = Depends(get_db), _=TU_THU):
    """Đổi nhãn (lưu là nhãn sửa tay, giữ qua pipeline.reset). Nhãn rỗng -> 400; trùng nhãn chủ đề khác -> 409
    (ThemeRiver phân biệt chuỗi theo nhãn). Đặt đúng bằng nhãn tự động thì coi như khôi phục."""
    nhan = " ".join(vao.nhan.split())
    if not nhan:
        raise HTTPException(status_code=400, detail="Nhãn chủ đề không được để trống.")
    goc = db.execute(text("SELECT nhan_tu_dong FROM chu_de WHERE id = :id"), {"id": chu_de_id}).scalar_one_or_none()
    return _dat_nhan(db, chu_de_id, nhan, sua_tay=goc is None or nhan != goc)


@router.post("/chu-de/{chu_de_id}/khoi-phuc")
def khoi_phuc_nhan_chu_de(chu_de_id: int, db: Session = Depends(get_db), _=TU_THU):
    """Bỏ nhãn sửa tay, quay về nhãn tự động (xóa khỏi chu_de_nhan_tay). 409 nếu nhãn tự động đang trùng nhãn khác."""
    goc = db.execute(text("SELECT nhan_tu_dong, nhan FROM chu_de WHERE id = :id"), {"id": chu_de_id}).first()
    if goc is None:
        raise HTTPException(status_code=404, detail="Không có chủ đề này.")
    return _dat_nhan(db, chu_de_id, goc.nhan_tu_dong or goc.nhan, sua_tay=False)
