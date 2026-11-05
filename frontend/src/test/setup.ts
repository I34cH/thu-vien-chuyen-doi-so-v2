import '@testing-library/jest-dom/vitest'

// jsdom chưa cài scrollTo
window.scrollTo = (() => undefined) as typeof window.scrollTo
Element.prototype.scrollIntoView = () => undefined
