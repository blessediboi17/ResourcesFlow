// js/admin.js

document.addEventListener('DOMContentLoaded', () => {
    checkUserSession();
    setupAuthListeners();
    setupUploadForm();
});

// 1. Session Checker
async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        showDashboard();
    } else {
        showLogin();
    }
}

function showDashboard() {
    document.getElementById('login-panel').style.display = 'none';
    document.getElementById('dashboard-panel').style.display = 'block';
    document.getElementById('logoutBtn').style.display = 'block';
}

function showLogin() {
    document.getElementById('login-panel').style.display = 'block';
    document.getElementById('dashboard-panel').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'none';
}

// 2. Login / Logout Flow
function setupAuthListeners() {
    document.getElementById('loginBtn').addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            alert(`Authentication failed: ${error.message}`);
        } else {
            showDashboard();
        }
    });

    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await supabase.auth.signOut();
        showLogin();
    });
}

// 3. File Upload and DB Writing Processing
function setupUploadForm() {
    const form = document.getElementById('uploadForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.innerText = "Uploading files... Please wait.";
        submitBtn.disabled = true;

        try {
            const thumbFile = document.getElementById('fileThumbnail').files[0];
            const assetFile = document.getElementById('fileAsset').files[0];

            // Setup unique file names
            const timestamp = Date.now();
            const thumbName = `${timestamp}_${thumbFile.name.replace(/\s+/g, '_')}`;
            const assetName = `${timestamp}_${assetFile.name.replace(/\s+/g, '_')}`;

            // A. Upload Thumbnail to Storage
            const { data: thumbData, error: thumbStorageErr } = await supabase.storage
                .from('thumbnails')
                .upload(thumbName, thumbFile);
            if (thumbStorageErr) throw thumbStorageErr;

            // B. Upload Main Asset File to Storage
            const { data: assetData, error: assetStorageErr } = await supabase.storage
                .from('assets')
                .upload(assetName, assetFile);
            if (assetStorageErr) throw assetStorageErr;

            // C. Extract Public Download URLs
            const { data: thumbUrlObj } = supabase.storage.from('thumbnails').getPublicUrl(thumbName);
            const { data: assetUrlObj } = supabase.storage.from('assets').getPublicUrl(assetName);

            // Parse tags input array
            const tagsInput = document.getElementById('assetTags').value;
            const tagsArray = tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : [];

            // D. Push Data object record into Database
            const newResource = {
                title: document.getElementById('assetTitle').value,
                description: document.getElementById('assetDesc').value,
                category: document.getElementById('assetCategory').value,
                file_size: document.getElementById('assetSize').value,
                thumbnail_url: thumbUrlObj.publicUrl,
                file_url: assetUrlObj.publicUrl,
                tags: tagsArray,
                featured: document.getElementById('assetFeatured').checked,
                downloads: 0
            };

            const { error: dbErr } = await supabase
                .from('resources')
                .insert([newResource]);

            if (dbErr) throw dbErr;

            alert('Resource created and published successfully!');
            form.reset();

        } catch (error) {
            console.error(error);
            alert(`Error uploading assets: ${error.message || error}`);
        } finally {
            submitBtn.innerText = "Publish Resource Asset";
            submitBtn.disabled = false;
        }
    });
              }
