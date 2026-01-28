// Category structure
const CATEGORIES = {
    "Development": {
        icon: "💻",
        subcategories: {
            "Frontend": ["JavaScript", "TypeScript", "React", "Vue", "CSS", "HTML"],
            "Backend": ["Node.js", "Python", "Java", "Go", "APIs", "Databases"],
            "DevOps": ["Docker", "Kubernetes", "CI/CD", "Cloud"],
            "Mobile": ["iOS", "Android", "React Native", "Flutter"],
            "Tools": ["Git", "IDEs", "Testing", "Performance"]
        }
    },
    "Learning": {
        icon: "📚",
        subcategories: {
            "Tutorials": ["Courses", "Documentation", "Guides"],
            "Articles": ["Blog Posts", "Case Studies"],
            "Videos": ["YouTube", "Conference Talks"]
        }
    },
    "Design": {
        icon: "🎨",
        subcategories: {
            "UI": ["Components", "Templates", "Icons"],
            "UX": ["Patterns", "Research", "Accessibility"],
            "Resources": ["Colors", "Fonts", "Images"]
        }
    },
    "Productivity": {
        icon: "⚡",
        subcategories: {
            "Tools": ["Project Management", "Notes", "Calendar"],
            "Communication": ["Email", "Chat", "Meetings"],
            "Documentation": ["Wikis", "Specs", "Docs"]
        }
    }
};

// Função para categorizar bookmark (por enquanto sempre retorna Não Categorizado)
async function categorizeBookmark(url, title) {
    return {
        mainCategory: "Não Categorizado",
        subCategory: "",
        tags: [],
        confidence: 1.0
    };
}

// Encontrar pasta existente para uma categoria
async function findCategoryFolder(mainCategory, subCategory) {
    try {
        const bookmarks = await chrome.bookmarks.getTree();
        const searchBookmarkTree = (nodes, categoryName) => {
            for (const node of nodes) {
                if (node.title === categoryName) {
                    return node;
                }
                if (node.children) {
                    const found = searchBookmarkTree(node.children, categoryName);
                    if (found) return found;
                }
            }
            return null;
        };

        // Procurar pasta principal
        const mainFolder = searchBookmarkTree(bookmarks[0].children, mainCategory);
        if (!mainFolder) return null;

        // Procurar subpasta
        if (subCategory) {
            return searchBookmarkTree(mainFolder.children, subCategory) || mainFolder;
        }

        return mainFolder;
    } catch (error) {
        console.error('Erro ao procurar pasta:', error);
        return null;
    }
}

// Criar nova pasta de categoria
async function createCategoryFolder(categoryName, parentId = '1') {
    try {
        const folder = await chrome.bookmarks.create({
            parentId: parentId,
            title: categoryName
        });
        return folder;
    } catch (error) {
        console.error('Erro ao criar pasta:', error);
        throw error;
    }
}

// Salvar bookmark em uma categoria
async function saveBookmarkToCategory(url, title, category) {
    try {
        // Encontrar ou criar pasta Não Categorizado
        let folder = await findCategoryFolder(category.mainCategory);
        if (!folder) {
            folder = await createCategoryFolder(category.mainCategory);
        }

        // Criar bookmark na pasta
        const bookmark = await chrome.bookmarks.create({
            parentId: folder.id,
            title: title,
            url: url
        });

        return bookmark;
    } catch (error) {
        console.error('Erro ao salvar bookmark:', error);
        throw error;
    }
}

// Listener para mensagens do popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'previewCategory') {
        (async () => {
            try {
                const category = await categorizeBookmark(request.url, request.title);
                sendResponse({
                    success: true,
                    category: category
                });
            } catch (error) {
                console.error('Erro ao categorizar:', error);
                sendResponse({
                    success: true,
                    category: {
                        mainCategory: "Não Categorizado",
                        subCategory: "",
                        tags: [],
                        confidence: 1.0
                    }
                });
            }
        })();
        return true;
    }
    
    if (request.action === 'addCurrentPage') {
        (async () => {
            try {
                const category = {
                    mainCategory: "Uncategorized",
                    subCategory: "",
                    tags: [],
                    confidence: 1.0
                };
                const bookmark = await saveBookmarkToCategory(request.url, request.title, category);

                sendResponse({
                    success: true,
                    category: category,
                    bookmark: bookmark
                });
            } catch (error) {
                console.error('Error adding page:', error);
                sendResponse({
                    success: false,
                    error: error.message
                });
            }
        })();
        return true;
    }
}); 