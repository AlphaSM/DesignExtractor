// static/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    const extractForm = document.getElementById('extractForm');
    const resultsSection = document.getElementById('results');
    
    extractForm.addEventListener('submit', handleFormSubmit);

    async function handleFormSubmit(e) {
        e.preventDefault();
        const url = document.getElementById('urlInput').value.trim();
        
        // Show loading state
        showLoading();
        
        try {
            const response = await fetch('/extract', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `url=${encodeURIComponent(url)}`
            });
            
            const data = await response.json();
            
            if (data.error) {
                showError(data.error);
                return;
            }
            
            renderResults(data);
        } catch (error) {
            showError(error.message);
        }
    }

    function showLoading() {
        const template = document.getElementById('loading-template');
        resultsSection.innerHTML = template.innerHTML;
    }

    function showError(message) {
        const template = document.getElementById('error-template');
        const errorElement = template.content.cloneNode(true);
        errorElement.querySelector('p').textContent = message;
        resultsSection.innerHTML = '';
        resultsSection.appendChild(errorElement);
    }

    function renderResults(data) {
        let html = '';

        // Render website structure
        if (data.structure) {
            html += createSection('Website Structure', renderStructure(data.structure));
        }

        // Render fonts
        if (data.fonts?.length) {
            html += createSection('Typography', renderFonts(data.fonts));
        }

        // Render color scheme
        if (data.colors?.length) {
            html += createSection('Color Scheme', renderColors(data.colors));
        }

        // Render buttons
        if (data.buttons?.length) {
            html += createSection('Buttons', renderButtons(data.buttons));
        }

        // Render navigation
        if (data.navigation?.length) {
            html += createSection('Navigation', renderNavigation(data.navigation));
        }

        // Render layout
        if (data.layout?.length) {
            html += createSection('Layout Components', renderLayout(data.layout));
        }

        // Render icons
        if (data.icons?.length) {
            html += createSection('Icons', renderIcons(data.icons));
        }

        // Render images
        if (data.images?.length) {
            html += createSection('Images', renderImages(data.images));
        }

        resultsSection.innerHTML = html || '<div class="no-results">No design elements found</div>';
        
        // Initialize syntax highlighting
        Prism.highlightAll();
        
        // Add copy functionality to all copy buttons
        addCopyButtonListeners();
    }

    function createSection(title, content) {
        return `
            <div class="element-card">
                <h2 class="element-card-title">${title}</h2>
                <div class="element-card-content">
                    ${content}
                </div>
            </div>
        `;
    }

    function renderStructure(structure) {
        const items = [
            { label: 'Header', value: structure.header },
            { label: 'Navigation', value: structure.nav },
            { label: 'Main Content', value: structure.main },
            { label: 'Footer', value: structure.footer },
            { label: 'Sidebar', value: structure.sidebar },
            { label: 'Number of Sections', value: structure.sections }
        ];

        return `
            <div class="structure-grid">
                ${items.map(item => `
                    <div class="structure-item">
                        <span class="structure-label">${item.label}</span>
                        <span class="structure-value">
                            ${typeof item.value === 'boolean' 
                                ? `<i class="fas fa-${item.value ? 'check' : 'times'}"></i>` 
                                : item.value}
                        </span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderFonts(fonts) {
        return `
            <div class="fonts-list">
                ${fonts.map(font => `
                    <div class="font-item">
                        <div class="font-preview" style="font-family: ${font}">${font}</div>
                        <code class="font-code">${font}</code>
                        <button class="copy-btn" data-copy="${font}">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderColors(colors) {
        return `
            <div class="colors-grid">
                ${colors.map(color => `
                    <div class="color-item">
                        <div class="color-preview" style="background-color: ${color}"></div>
                        <code class="color-code">${color}</code>
                        <button class="copy-btn" data-copy="${color}">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderButtons(buttons) {
        return `
            <div class="buttons-grid">
                ${buttons.map((button, index) => `
                    <div class="button-item">
                        <h3>Button ${index + 1}</h3>
                        <div class="preview-box">
                            ${button.html}
                        </div>
                        <div class="button-details">
                            <p><strong>Type:</strong> ${button.type}</p>
                            ${button.classes.length ? `<p><strong>Classes:</strong> ${button.classes.join(' ')}</p>` : ''}
                            ${button.href ? `<p><strong>Link:</strong> ${button.href}</p>` : ''}
                        </div>
                        <pre><code class="language-html">${escapeHtml(button.html)}</code></pre>
                        <button class="copy-btn" data-copy="${escapeHtml(button.html)}">
                            <i class="fas fa-copy"></i> Copy HTML
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderNavigation(navigation) {
        return `
            <div class="navigation-list">
                ${navigation.map((nav, index) => `
                    <div class="navigation-item">
                        <h3>Navigation ${index + 1}</h3>
                        <div class="preview-box">
                            ${nav.html}
                        </div>
                        <div class="nav-details">
                            <p><strong>Type:</strong> ${nav.type}</p>
                            <p><strong>Items:</strong> ${nav.items.length}</p>
                        </div>
                        <pre><code class="language-html">${escapeHtml(nav.html)}</code></pre>
                        <button class="copy-btn" data-copy="${escapeHtml(nav.html)}">
                            <i class="fas fa-copy"></i> Copy HTML
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderLayout(layout) {
        return `
            <div class="layout-list">
                ${layout.map((item, index) => `
                    <div class="layout-item">
                        <h3>Layout Component ${index + 1}</h3>
                        <div class="layout-details">
                            <p><strong>Type:</strong> ${item.type}</p>
                            ${item.classes.length ? `<p><strong>Classes:</strong> ${item.classes.join(' ')}</p>` : ''}
                        </div>
                        <pre><code class="language-html">${escapeHtml(item.html)}</code></pre>
                        <button class="copy-btn" data-copy="${escapeHtml(item.html)}">
                            <i class="fas fa-copy"></i> Copy HTML
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderIcons(icons) {
        return `
            <div class="icons-grid">
                ${icons.map((icon, index) => `
                    <div class="icon-item">
                        <div class="preview-box">
                            ${icon.html}
                        </div>
                        <div class="icon-details">
                            <p><strong>Type:</strong> ${icon.type}</p>
                            ${icon.classes.length ? `<p><strong>Classes:</strong> ${icon.classes.join(' ')}</p>` : ''}
                        </div>
                        <pre><code class="language-html">${escapeHtml(icon.html)}</code></pre>
                        <button class="copy-btn" data-copy="${escapeHtml(icon.html)}">
                            <i class="fas fa-copy"></i> Copy HTML
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderImages(images) {
        return `
            <div class="images-grid">
                ${images.map((image, index) => `
                    <div class="image-item">
                        <div class="preview-box">
                            ${image.data 
                                ? `<img src="${image.data}" alt="${image.alt}" class="image-preview">` 
                                : '<div class="image-placeholder">Image preview not available</div>'
                            }
                        </div>
                        <div class="image-details">
                            <p><strong>Source:</strong> ${image.src}</p>
                            ${image.alt ? `<p><strong>Alt Text:</strong> ${image.alt}</p>` : ''}
                            ${image.width ? `<p><strong>Dimensions:</strong> ${image.width}x${image.height}</p>` : ''}
                        </div>
                        <pre><code class="language-html">${escapeHtml(image.html)}</code></pre>
                        <button class="copy-btn" data-copy="${escapeHtml(image.html)}">
                            <i class="fas fa-copy"></i> Copy HTML
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function escapeHtml(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }

    function addCopyButtonListeners() {
        document.querySelectorAll('.copy-btn').forEach(button => {
            button.addEventListener('click', async () => {
                const textToCopy = button.dataset.copy;
                try {
                    await navigator.clipboard.writeText(textToCopy);
                    const originalText = button.innerHTML;
                    button.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    button.classList.add('copied');
                    setTimeout(() => {
                        button.innerHTML = originalText;
                        button.classList.remove('copied');
                    }, 2000);
                } catch (err) {
                    button.innerHTML = '<i class="fas fa-times"></i> Failed to copy';
                    button.classList.add('copy-error');
                    setTimeout(() => {
                        button.innerHTML = originalText;
                        button.classList.remove('copy-error');
                    }, 2000);
                }
            });
        });
    }
});