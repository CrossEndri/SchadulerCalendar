import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;

// Default categories
const DEFAULT_CATEGORIES = [
    { name: 'Rapat Internal', color: '#3b82f6' },
    { name: 'Pertemuan dengan Klien', color: '#10b981' },
    { name: 'Kegiatan Olahraga', color: '#f97316' },
    { name: 'Perjalanan Bisnis', color: '#8b5cf6' },
    { name: 'Kegiatan Pribadi', color: '#ec4899' }
];

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        await initializeDefaultCategories();
        loadCategories();
    } else {
        alert('Please login to manage categories');
        window.location.href = 'login.html';
    }
});

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'login.html';
        } catch (error) {
            console.error("Logout error:", error);
        }
    });
}

// Initialize default categories if user has none
async function initializeDefaultCategories() {
    if (!currentUser) return;
    
    const q = query(collection(db, "categories"), where("userId", "==", currentUser.uid));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        // Create default categories
        for (const category of DEFAULT_CATEGORIES) {
            await addDoc(collection(db, "categories"), {
                name: category.name,
                color: category.color,
                userId: currentUser.uid,
                createdAt: Timestamp.now()
            });
        }
    }
}

// Load categories
async function loadCategories() {
    if (!currentUser) return;
    
    const categoriesList = document.getElementById('categoriesList');
    categoriesList.innerHTML = '';
    
    const q = query(collection(db, "categories"), where("userId", "==", currentUser.uid));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        categoriesList.innerHTML = '<p style="color: #6b7280;">No categories yet. Add one above!</p>';
        return;
    }
    
    querySnapshot.forEach((doc) => {
        const category = doc.data();
        const categoryDiv = document.createElement('div');
        categoryDiv.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 1rem; border: 1px solid var(--border-color); border-radius: 4px; margin-bottom: 0.5rem;';
        
        categoryDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="width: 30px; height: 30px; background-color: ${category.color}; border-radius: 4px;"></div>
                <span style="font-weight: 500;">${category.name}</span>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn secondary edit-btn" data-id="${doc.id}" data-name="${category.name}" data-color="${category.color}">Edit</button>
                <button class="btn secondary delete-btn" data-id="${doc.id}" style="color: var(--danger-color);">Delete</button>
            </div>
        `;
        
        categoriesList.appendChild(categoryDiv);
    });
    
    // Add event listeners
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const name = e.target.dataset.name;
            const color = e.target.dataset.color;
            openEditModal(id, name, color);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            if (confirm('Are you sure you want to delete this category?')) {
                await deleteCategory(id);
            }
        });
    });
}

// Add category
const addCategoryForm = document.getElementById('addCategoryForm');
if (addCategoryForm) {
    addCategoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        
        const name = document.getElementById('categoryName').value;
        const color = document.getElementById('categoryColor').value;
        
        try {
            await addDoc(collection(db, "categories"), {
                name,
                color,
                userId: currentUser.uid,
                createdAt: Timestamp.now()
            });
            
            document.getElementById('categoryName').value = '';
            document.getElementById('categoryColor').value = '#3b82f6';
            loadCategories();
        } catch (error) {
            console.error("Error adding category:", error);
            alert("Error adding category");
        }
    });
}

// Edit category modal
const editCategoryModal = document.getElementById('editCategoryModal');
const closeEditModal = document.getElementById('closeEditModal');
const cancelEditBtn = document.getElementById('cancelEditBtn');

function openEditModal(id, name, color) {
    document.getElementById('editCategoryId').value = id;
    document.getElementById('editCategoryName').value = name;
    document.getElementById('editCategoryColor').value = color;
    editCategoryModal.style.display = 'flex';
}

function closeEditModalFunc() {
    editCategoryModal.style.display = 'none';
}

if (closeEditModal) {
    closeEditModal.addEventListener('click', closeEditModalFunc);
}

if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', closeEditModalFunc);
}

// Edit category form
const editCategoryForm = document.getElementById('editCategoryForm');
if (editCategoryForm) {
    editCategoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('editCategoryId').value;
        const name = document.getElementById('editCategoryName').value;
        const color = document.getElementById('editCategoryColor').value;
        
        try {
            const categoryRef = doc(db, "categories", id);
            await updateDoc(categoryRef, {
                name,
                color
            });
            
            closeEditModalFunc();
            loadCategories();
        } catch (error) {
            console.error("Error updating category:", error);
            alert("Error updating category");
        }
    });
}

// Delete category
async function deleteCategory(id) {
    try {
        await deleteDoc(doc(db, "categories", id));
        loadCategories();
    } catch (error) {
        console.error("Error deleting category:", error);
        alert("Error deleting category");
    }
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === editCategoryModal) {
        closeEditModalFunc();
    }
});
