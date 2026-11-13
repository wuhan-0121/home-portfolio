import './assets/scss/all.scss'

// header：手機版漢堡選單，點按鈕展開／收合，點選單外面或按 Esc 收合
const nav = document.querySelector('nav')
const navToggle = nav?.querySelector('.nav-toggle')

if (nav && navToggle) {
  function setNavOpen(isOpen) {
    nav.classList.toggle('is-open', isOpen)
    navToggle.setAttribute('aria-expanded', isOpen)
    navToggle.setAttribute('aria-label', isOpen ? '關閉選單' : '開啟選單')
  }
  navToggle.addEventListener('click', () => setNavOpen(!nav.classList.contains('is-open')))
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) setNavOpen(false)
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setNavOpen(false)
  })
  // 視窗拉回桌機寬度時自動收合
  matchMedia('(min-width: 768px)').addEventListener('change', (e) => {
    if (e.matches) setNavOpen(false)
  })
}

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

  // 超過 maxVisible 頁時，只顯示第一頁、最後一頁與目前頁前後各一頁，其餘以 … 表示
  const maxVisible = 3

  // 目前篩選後的總頁數（至少 1 頁）
  function getTotalPages() {
    return Math.max(1, Math.ceil(filteredItems.length / perPage))
  }

  // 算出要顯示哪些頁碼，'...' 代表省略
  // 例如共 10 頁、目前第 4 頁 → [1, '...', 3, 4, 5, '...', 10]
  function getPageList(totalPages) {
    // 3 頁以內：全部顯示
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    // 目前頁的前一頁到後一頁（不含第一頁和最後一頁，那兩個另外加）
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    const list = [1] // 第一頁一定顯示
    if (start > 2) list.push('...') // 跟第一頁中間有跳號 → 加 …
    for (let i = start; i <= end; i++) list.push(i)
    if (end < totalPages - 1) list.push('...') // 跟最後一頁中間有跳號 → 加 …
    list.push(totalPages) // 最後一頁一定顯示
    return list
  }

  // 依 getPageList 的結果產生頁碼按鈕，插在「下一頁」按鈕前面
  // 每次換頁都會重新產生，因為 … 的位置會跟著目前頁改變
  function renderPageBtns(totalPages) {
    pageBtns.forEach((btn) => btn.remove()) // 先清掉舊的頁碼
    pageBtns = getPageList(totalPages).map((page) => {
      const btn = document.createElement('div')
      if (page === '...') {
        // 省略號：不能點，樣式在 _portfolio.scss 的 .page-ellipsis
        btn.className = 'page-ellipsis'
        btn.textContent = '…'
      } else {
        btn.className = 'page-btn'
        btn.textContent = page
        btn.classList.toggle('is-active', page === currentPage)
        btn.addEventListener('click', () => goToPage(page))
      }
      nextBtn.before(btn)
      return btn
    })
  }

  // 切到第 page 頁：只顯示該頁的影片，並更新頁碼按鈕
  function goToPage(page) {
    const totalPages = getTotalPages()
    currentPage = Math.min(Math.max(page, 1), totalPages)
    const start = (currentPage - 1) * perPage
    const visible = filteredItems.slice(start, start + perPage)
    items.forEach((item) => {
      item.hidden = !visible.includes(item)
    })
    renderPageBtns(totalPages)
    prevBtn.classList.toggle('is-disabled', currentPage === 1)
    nextBtn.classList.toggle('is-disabled', currentPage === totalPages)
  }

  function filterBy(category) {
    filteredItems = category === 'all'
      ? items
      : items.filter((item) => item.dataset.category.split(' ').includes(category))
    tabs.forEach((tab) => tab.classList.toggle('is-active', tab.dataset.filter === category))
    const isEmpty = filteredItems.length === 0
    if (emptyMsg) emptyMsg.hidden = !isEmpty
    pagination.hidden = isEmpty
    goToPage(1)
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => filterBy(tab.dataset.filter))
  })
  prevBtn.addEventListener('click', () => goToPage(currentPage - 1))
  nextBtn.addEventListener('click', () => goToPage(currentPage + 1))
  filterBy('all')
}

// 委託須知：QA 展開選單，點問題按鈕切換展開／收合（可同時展開多個）
document.querySelectorAll('.qa-question').forEach((btn) => {
  btn.addEventListener('click', () => {
    const isOpen = btn.closest('.qa-item').classList.toggle('is-open')
    btn.setAttribute('aria-expanded', isOpen)
  })
})

// 首頁：horizontal-card / vertical-card 圖片輪播（橫向滑動），.card-img 裡有 2 張以上圖片才啟動
// 桌機：滑鼠移上去暫停並顯示左右箭頭；手機：左右滑動切換
// 最後面多複製一張第一張圖，滑到複製圖後瞬間跳回真正的第一張，看起來就會一直往同方向滑不會倒退
document.querySelectorAll('.horizontal-card .card-img, .vertical-card .card-img').forEach((cardImg) => {
  const imgs = [...cardImg.querySelectorAll('img')]
  // 左右箭頭來自 layout/carousel-arrows.ejs
  const prevBtn = cardImg.querySelector('.carousel-prev')
  const nextBtn = cardImg.querySelector('.carousel-next')
  if (imgs.length < 2) {
    // 只有 1 張圖不輪播，箭頭用不到就移除
    prevBtn?.remove()
    nextBtn?.remove()
    return
  }
  const interval = 3000
  const swipeThreshold = 40 // 手指滑超過幾 px 才算切換
  let current = 0
  let timer = null

  const track = document.createElement('div')
  track.className = 'carousel-track'
  track.append(...imgs, imgs[0].cloneNode())
  cardImg.append(track)
  cardImg.classList.add('is-carousel')

  // 不帶動畫瞬間移到第 index 張（用在複製圖和真正第一張之間互跳）
  function jumpTo(index) {
    current = index
    track.style.transition = 'none'
    track.style.transform = `translateX(-${current * 100}%)`
    track.offsetWidth // 強制重排，讓瞬間跳轉生效後再開始滑動
  }
  function slideTo(index) {
    current = index
    track.style.transition = ''
    track.style.transform = `translateX(-${current * 100}%)`
  }

  function next() {
    // 分頁切到背景時 transitionend 可能沒觸發，保險起見停在複製圖就先跳回第一張
    if (current >= imgs.length) jumpTo(0)
    slideTo(current + 1)
  }
  function prev() {
    // 在第一張往前：先瞬間跳到最後面的複製圖（看起來一樣），再往前滑到最後一張
    if (current <= 0) jumpTo(imgs.length)
    slideTo(current - 1)
  }
  track.addEventListener('transitionend', () => {
    if (current === imgs.length) jumpTo(0)
  })

  function start() {
    clearInterval(timer)
    timer = setInterval(next, interval)
  }
  function stop() {
    clearInterval(timer)
  }

  // 箭頭只會在滑鼠移上去時出現，這時輪播已經暫停，滑鼠移開才重新計時，不會點完馬上又自動跳
  prevBtn?.addEventListener('click', prev)
  nextBtn?.addEventListener('click', next)

  // 只對滑鼠暫停；手機點擊也會觸發 mouseenter，用 pointerType 排除觸控
  cardImg.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'mouse') stop()
  })
  cardImg.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse') start()
  })

  // 手機滑動：橫向位移大於門檻且大於縱向位移才切換，避免上下捲頁面時誤觸
  let touchStartX = 0
  let touchStartY = 0
  cardImg.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX
    touchStartY = e.touches[0].clientY
  }, { passive: true })
  cardImg.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX
    const dy = e.changedTouches[0].clientY - touchStartY
    if (Math.abs(dx) < swipeThreshold || Math.abs(dx) < Math.abs(dy)) return
    if (dx < 0) next()
    else prev()
    start() // 滑完重新計時
  })

  start()
})

// 價目表：電腦版點圖片開燈箱看大圖，手機版圖片已經滿版就不開
// 燈箱內可用左右箭頭（或鍵盤 ← →）切換，Esc／點背景關閉
const priceImageBtns = [...document.querySelectorAll('.price-image-btn')]
const lightbox = document.querySelector('.lightbox')

if (priceImageBtns.length && lightbox) {
  const isDesktop = matchMedia('(min-width: 768px)')
  const lightboxImg = lightbox.querySelector('.lightbox-img')
  const images = priceImageBtns.map((btn) => btn.querySelector('img'))
  let current = 0

  function show(index) {
    current = (index + images.length) % images.length // 頭尾循環
    lightboxImg.src = images[current].src
    lightboxImg.alt = images[current].alt
  }

  priceImageBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      if (!isDesktop.matches) return
      show(i)
      lightbox.showModal()
    })
  })
  lightbox.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close())
  lightbox.querySelector('.lightbox-prev').addEventListener('click', () => show(current - 1))
  lightbox.querySelector('.lightbox-next').addEventListener('click', () => show(current + 1))
  // 點到 dialog 本身（圖片和按鈕以外的背景）就關閉
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) lightbox.close()
  })
  lightbox.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(current - 1)
    if (e.key === 'ArrowRight') show(current + 1)
  })
  // 開著燈箱時把視窗縮到手機寬度，就直接關掉
  isDesktop.addEventListener('change', (e) => {
    if (!e.matches && lightbox.open) lightbox.close()
  })
}

// 價目表：估價小工具，金額規則要跟 price-list.html 上的價目表一致
const estimator = document.querySelector('.estimator')

if (estimator) {
  const durationField = estimator.querySelector('.estimator-duration')
  const totalEl = estimator.querySelector('.estimator-total')
  const remarkEl = estimator.querySelector('.estimator-remark')
  const defaultRemark = remarkEl.textContent

  // 每個項目的基本價：min~max 是區間，from 為 true 表示「起」
  // 需要影片長度的項目用 bySeconds(秒數) 計算
  const prices = {
    'one-image': { min: 650, max: 800 },
    lyrics: { min: 650, max: 800 },
    // 非一圖流：600 NTD/min，20 秒進位 → 每 20 秒 200
    pv: { bySeconds: (s) => Math.ceil(s / 20) * 200 },
    // 影視剪輯：40 秒 600 起，多 20 秒加 200（不足 20 秒也算 20 秒）
    edit: { bySeconds: (s) => 600 + Math.ceil(Math.max(0, s - 40) / 20) * 200, from: true },
    loop: { min: 800, from: true },
    camera: { min: 1200, from: true },
  }
  // 各項目額外顯示的備註
  const remarks = {
    'one-image': '此報價歌手人數限兩人以內，兩人以上將重新報價。',
    lyrics: '此報價歌手人數限兩人以內，兩人以上將重新報價。',
    pv: '此報價歌手人數限兩人以內，兩人以上將重新報價。',
    edit: '劇情向剪輯將視片源長度另行報價。',
  }

  const format = (n) => Math.round(n).toLocaleString('en-US')

  function update() {
    const data = new FormData(estimator)
    const price = prices[data.get('item')]
    const seconds = (Number(data.get('min')) || 0) * 60 + (Number(data.get('sec')) || 0)
    let rate = 1
    if (data.get('commercial')) rate *= 2.5
    if (data.get('rush')) rate *= 1.5

    durationField.hidden = !price.bySeconds
    const remark = remarks[data.get('item')]
    remarkEl.textContent = remark ? `※ ${remark} ${defaultRemark.slice(2)}` : defaultRemark

    if (price.bySeconds && seconds <= 0) {
      totalEl.textContent = '請輸入影片長度'
      return
    }
    let text
    if (price.bySeconds) {
      text = `${format(price.bySeconds(seconds) * rate)} NTD`
    } else if (price.max) {
      text = `${format(price.min * rate)} ~ ${format(price.max * rate)} NTD`
    } else {
      text = `${format(price.min * rate)} NTD`
    }
    totalEl.textContent = price.from ? `${text} 起` : text
  }

  estimator.addEventListener('input', update)
  estimator.addEventListener('submit', (e) => e.preventDefault())
  update()
}
