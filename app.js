const API_URL = "https://www.googleapis.com/books/v1/volumes";
const API_KEY = "AIzaSyCNsvyUBuDrD1XM7i3NCcxia54p6N0ezRI";

const searchInput = document.getElementById("searchInput");
const searchBtn   = document.getElementById("searchBtn");
const resultsDiv  = document.getElementById("results");
const loadingDiv  = document.getElementById("loading");
const resultInfo  = document.getElementById("resultInfo");

let currentBook = null;

async function searchBooks(query = null) {
    const searchQuery = query || searchInput.value.trim();
    if (!searchQuery) {
        alert("Please type something to search!");
        return;
    }
    if (query) searchInput.value = query;

    loadingDiv.classList.remove("hidden");
    resultInfo.classList.add("hidden");
    resultsDiv.innerHTML = "";

    try {
        const url = `${API_URL}?q=${encodeURIComponent(searchQuery)}&maxResults=20&key=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("API did not respond");
        const data = await response.json();

        loadingDiv.classList.add("hidden");

        if (data.totalItems > 0) {
            resultInfo.textContent = `${data.totalItems.toLocaleString()} results for "${searchQuery}"`;
            resultInfo.classList.remove("hidden");
        }

        displayBooks(data.items);

    } catch (error) {
        loadingDiv.classList.add("hidden");
        resultsDiv.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <p>Something went wrong. Check your connection and try again.</p>
            </div>
        `;
        console.error("Error:", error);
    }
}

function displayBooks(books) {
    if (!books || books.length === 0) {
        resultsDiv.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>No books found. Try a different search.</p>
            </div>
        `;
        return;
    }

    resultsDiv.innerHTML = books.map(book => {
        const info    = book.volumeInfo;
        const title   = info.title || "No title";
        const authors = info.authors ? info.authors[0] : "Unknown author";
        const year    = info.publishedDate ? info.publishedDate.substring(0, 4) : "";
        const cover   = info.imageLinks?.thumbnail
            || `https://placehold.co/160x220/1a1a1a/888?text=No+Cover`;

        return `
            <div class="book-card" onclick="openModal('${book.id}')">
                <img src="${cover}" alt="${escapeHtml(title)}" loading="lazy" />
                <div class="card-info">
                    <div class="card-title">${escapeHtml(title)}</div>
                    <div class="card-author">${escapeHtml(authors)}</div>
                    ${year ? `<div class="card-year">${year}</div>` : ""}
                </div>
            </div>
        `;
    }).join("");

    window._books = books;
}

function openModal(bookId) {
    const book = window._books.find(b => b.id === bookId);
    if (!book) return;

    currentBook = book;
    const info = book.volumeInfo;

    const title   = info.title || "No title";
    const authors = info.authors ? info.authors.join(", ") : "Unknown author";
    const year    = info.publishedDate ? info.publishedDate.substring(0, 4) : "—";
    const pages   = info.pageCount ? `${info.pageCount} pages` : "Page count unavailable";
    const desc    = info.description
        ? info.description.substring(0, 400) + "..."
        : "No description available for this book.";
    const cover   = info.imageLinks?.thumbnail
        || `https://placehold.co/110x160/1a1a1a/888?text=No+Cover`;

    const list    = getReadingList();
    const isAdded = list.some(b => b.id === bookId);
    const btnText = isAdded ? "✓ In your list" : "+ Add to Reading List";
    const btnClass = isAdded ? "modal-btn added" : "modal-btn";

    document.getElementById("modalContent").innerHTML = `
        <div class="modal-inner">
            <img class="modal-cover" src="${cover}" alt="${escapeHtml(title)}" />
            <div class="modal-info">
                <h2>${escapeHtml(title)}</h2>
                <div class="modal-author">${escapeHtml(authors)}</div>
                <div class="modal-meta">${year} · ${pages}</div>
                <button class="${btnClass}" id="addBtn" onclick="toggleReadingList('${bookId}')">
                    ${btnText}
                </button>
            </div>
        </div>
        <div class="modal-desc">${escapeHtml(desc)}</div>
    `;

    document.getElementById("modal").classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeModal() {
    document.getElementById("modal").classList.add("hidden");
    document.body.style.overflow = "";
}

function getReadingList() {
    const data = localStorage.getItem("readingList");
    return data ? JSON.parse(data) : [];
}

function toggleReadingList(bookId) {
    let list  = getReadingList();
    const idx = list.findIndex(b => b.id === bookId);

    if (idx === -1) {
        const info = currentBook.volumeInfo;
        list.push({
            id:     bookId,
            title:  info.title || "No title",
            author: info.authors?.[0] || "Unknown",
            cover:  info.imageLinks?.thumbnail || ""
        });
        document.getElementById("addBtn").textContent = "✓ In your list";
        document.getElementById("addBtn").classList.add("added");
    } else {
        list.splice(idx, 1);
        document.getElementById("addBtn").textContent = "+ Add to Reading List";
        document.getElementById("addBtn").classList.remove("added");
    }

    localStorage.setItem("readingList", JSON.stringify(list));
}

function quickSearch(query) { searchBooks(query); }

function escapeHtml(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

searchBtn.addEventListener("click", () => searchBooks());
searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchBooks();
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
});