// js/detail.js

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const resourceId = params.get('id');

    if (!resourceId) {
        window.location.href = 'index.html';
        return;
    }

    const { data: resource, error } = await supabase
        .from('resources')
        .select('*')
        .eq('id', resourceId)
        .single();

    if (error || !resource) {
        document.getElementById('resource-container').innerHTML = '<h2>Resource not found</h2>';
        return;
    }

    // Populate the page
    document.getElementById('resource-container').innerHTML = `
        <img src="${resource.thumbnail_url}" style="width: 100%; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="margin-bottom: 10px;">${resource.title}</h1>
        <p style="color: var(--text-muted); margin-bottom: 20px;">${resource.description}</p>
        
        <div style="display: flex; gap: 20px; align-items: center;">
            <button onclick="downloadResource('${resource.id}', '${resource.file_url}')" 
                    style="background: var(--accent-color); border: none; padding: 12px 24px; border-radius: 8px; color: white; cursor: pointer;">
                Download (${resource.file_size})
            </button>
            <p>Downloads: ${resource.downloads}</p>
        </div>
    `;
});

async function downloadResource(id, url) {
    // 1. Trigger the actual browser download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    link.remove();

    // 2. Increment download count in Supabase
    // Note: We use an RPC or just update the count directly
    const { data, error } = await supabase.rpc('increment_downloads', { row_id: id });
}

// Append this code to the bottom of js/detail.js

const params = new URLSearchParams(window.location.search);
const resourceId = params.get('id');

// Run these functions right after loading the core resource details
if (resourceId) {
    loadInteractions();
}

function loadInteractions() {
    fetchRatings();
    fetchComments();
    setupInteractionListeners();
}

// 1. Fetch & Calculate Ratings Breakdown
async function fetchRatings() {
    const { data: ratings, error } = await supabase
        .from('ratings')
        .select('rating')
        .eq('resource_id', resourceId);

    if (error) return;

    const total = ratings.length;
    document.getElementById('total-ratings').innerText = `${total} rating${total === 1 ? '' : 's'}`;

    if (total > 0) {
        const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
        const avg = (sum / total).toFixed(1);
        document.getElementById('avg-rating').innerText = avg;
    } else {
        document.getElementById('avg-rating').innerText = '0.0';
    }
}

// 2. Fetch & Render Comments
async function fetchComments() {
    const { data: comments, error } = await supabase
        .from('comments')
        .select('*')
        .eq('resource_id', resourceId)
        .order('created_at', { ascending: false });

    if (error) return;

    const commentsList = document.getElementById('comments-list');
    if (comments.length === 0) {
        commentsList.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No comments yet. Be the first!</p>';
        return;
    }

    commentsList.innerHTML = comments.map(c => `
        <div style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span style="font-weight: 600; font-size: 0.95rem; color: var(--accent-color);">${c.username}</span>
                <span style="font-size: 0.8rem; color: var(--text-muted);">${new Date(c.created_at).toLocaleDateString()}</span>
            </div>
            <p style="font-size: 0.95rem; line-height: 1.5; color: #e5e7eb;">${c.comment}</p>
        </div>
    `).join('');
}

// 3. Form Submissions
void function setupInteractionListeners() {
    // Submit Rating
    document.getElementById('submitRatingBtn').addEventListener('click', async () => {
        const score = parseInt(document.getElementById('ratingSelect').value);
        
        const { error } = await supabase
            .from('ratings')
            .insert([{ resource_id: resourceId, rating: score }]);

        if (error) {
            alert('Could not submit rating. Try again!');
        } else {
            alert('Thank you for rating!');
            fetchRatings(); // Refresh stats
        }
    });

    // Submit Comment
    document.getElementById('submitCommentBtn').addEventListener('click', async () => {
        const userField = document.getElementById('commentUser');
        const textField = document.getElementById('commentText');

        if (!userField.value.trim() || !textField.value.trim()) {
            alert('Please fill out your name and comment fields.');
            return;
        }

        const { error } = await supabase
            .from('comments')
            .insert([{ 
                resource_id: resourceId, 
                username: userField.value.trim(), 
                comment: textField.value.trim() 
            }]);

        if (error) {
            alert('Error posting comment.');
        } else {
            textField.value = ''; // Reset comment field
            fetchComments(); // Refresh list
        }
    });
}();
