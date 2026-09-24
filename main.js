import './assets/scss/all.scss'

// 作品集：tabs 篩選 + 分頁（每頁 12 支），頁碼依篩選後的影片數量自動產生
const videoGroup = document.querySelector('.video-group')
const pagination = document.querySelector('.page')

if (videoGroup && pagination) {
  const perPage = 12
  const tabs = [...document.querySelectorAll('.video-tabs-item')]
  const items = [...videoGroup.querySelectorAll('.video-item')]
  const prevBtn = pagination.querySelector('.previous-page')
  const nextBtn = pagination.querySelector('.next-page')
  const emptyMsg = document.querySelector('.video-empty')
  let filteredItems = items
  let pageBtns = []
  let currentPage = 1

  function renderPageBtns() {
    const totalPages = Math.max(1, Math.ceil(filteredItems.length / perPage))
    pageBtns.forEach((btn) => btn.remove())
    pageBtns = Array.from({ length: totalPages }, (_, i) => {
      const btn = document.createElement('div')
      btn.className = 'page-btn'
      btn.textContent = i + 1
      btn.addEventListener('click', () => goToPage(i + 1))
      nextBtn.before(btn)
      return btn
    })
  }

  function goToPage(page) {
    const totalPages = pageBtns.length
    currentPage = Math.min(Math.max(page, 1), totalPages)
    const start = (currentPage - 1) * perPage
    const visible = filteredItems.slice(start, start + perPage)
    items.forEach((item) => {
      item.hidden = !visible.includes(item)
    })
    pageBtns.forEach((btn, i) => btn.classList.toggle('is-active', i + 1 === currentPage))
    prevBtn.classList.toggle('is-disabled', currentPage === 1)
    nextBtn.classList.toggle('is-disabled', currentPage === totalPages)
  }

  function filterBy(category) {
    filteredItems = category === 'all'
      ? items
      : items.filter((item) => item.dataset.category === category)
    tabs.forEach((tab) => tab.classList.toggle('is-active', tab.dataset.filter === category))
    const isEmpty = filteredItems.length === 0
    if (emptyMsg) emptyMsg.hidden = !isEmpty
    pagination.hidden = isEmpty
    renderPageBtns()
    goToPage(1)
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => filterBy(tab.dataset.filter))
  })
  prevBtn.addEventListener('click', () => goToPage(currentPage - 1))
  nextBtn.addEventListener('click', () => goToPage(currentPage + 1))
  filterBy('all')
}
