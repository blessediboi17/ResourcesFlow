// js/app.js

document.addEventListener('DOMContentLoaded', () => {
    fetchFeaturedResources();
    fetchLatestResources();
    setupSearch();
});

// 1. Fetch and Display Featured Resources
async function fetchFeaturedResources() {
    const { data: resources, error } = await supabase
        .from('resources')
        .select('*')
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(4);

    if (error) {
        console.error('Error fetching featured items:', error);
        return;
    }

    renderGrid('featuredGrid', resources);
}

// 2. Fetch and Display Latest Uploads
async function fetchLatestResources() {
    const { data: resources, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8);

    if (error) {
        console.error('Error fetching latest items:', error);
        return;
    }

    renderGrid('latestGrid', resources);
}

// 3. Search System (Title, Categories, Tags)
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', async (e) => {
        const query = e.target.value.trim();

        // If search is empty, reload default layouts
        if (query === '') {
            fetchFeaturedResources();
            fetchLatestResources();
            return;
        }

        // Supabase text search across fields
        const { data: resources, error } = await supabase
            .from('resources')
            .select('*')
            .or(`title.ilike.%${query}%,category.ilike.%${query}%,tags.cs.{${query}}`);

        if (error) {
            console.error('Search error:', error);
            return;
        }

        // Overwrite the latest grid with search results & clear featured
        document.getElementById('featuredGrid').innerHTML = '<p style="color: var(--text-muted)">Showing search results below...</p>';
        renderGrid('latestGrid', resources);
    });
}

// Helper Function to Render Resource Cards into the HTML
function renderGrid(gridId, resources) {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    if (resources.length === 0) {
        grid.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No assets found.</p>';
        return;
    }

    grid.innerHTML = resources.map(item => `
        <div class="glass-card card" onclick="window.location.href='resource.html?id=${item.id}'" style="cursor: pointer;">
            <img src="${item.thumbnail_url}" alt="${item.title}" class="card-preview" onerror="this.src='https://via.placeholder.com/400x250?text=No+Preview'">
            <div class="card-body">
                <span class="card-category">${item.category}</span>
                <h3 class="card-title">${item.title}</h3>
                <div class="card-footer">
                    <span>${item.file_size}</span>
                    <span>📥 ${item.downloads} downloads</span>
                </div>
            </div>
        </div>
    `).join('');
              }
