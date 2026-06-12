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
