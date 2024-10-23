document.addEventListener('DOMContentLoaded', () => {
    const extractForm = document.getElementById('extractForm');
    const resultsSection = document.getElementById('results');
    const loadingTemplate = document.getElementById('loading-template');
    const errorTemplate = document.getElementById('error-template');

    extractForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = document.getElementById('urlInput').value.trim();
        
        // Show loading state
        resultsSection.innerHTML = loadingTemplate.innerHTML;
        
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
                throw new Error(data.error);
            }
            
            displayResults(data);
        } catch (error) {
            showError(error.message);
        }
    });

    function createCodeBlock(code, language) {
        const container = document.createElement('div');
        container.className = 'relative rounded-lg bg-slate-950 p-4';
        
        const pre = document.createElement('pre');
        pre.className = 'overflow-x-auto';
        
        const codeElement = document.createElement('code');
        codeElement.className = `text-sm text-slate-50 language-${language}`;
        codeElement.textContent = code;
        
        const copyButton = document.createElement('button');
        copyButton.className = 'absolute right-2 top-2 rounded bg-slate-800 px-2 py-1 text-xs text-white hover:bg-slate-700';
        copyButton.textContent = 'Copy';
        copyButton.onclick = () => {
            navigator.clipboard.writeText(code);
            copyButton.textContent = 'Copied!';
            setTimeout(() => copyButton.textContent = 'Copy', 2000);
        };
        
        pre.appendChild(codeElement);
        container.appendChild(pre);
        container.appendChild(copyButton);
        
        // Highlight the code if Prism is available
        if (window.Prism) {
            Prism.highlightElement(codeElement);
        }
        
        return container;
    }

    function createElementCard(title, content) {
        const card = document.createElement('div');
        card.className = 'mb-6 rounded-lg border border-slate-200 bg-white shadow-sm';
        
        const header = document.createElement('div');
        header.className = 'border-b border-slate-200 p-4';
        
        const titleElement = document.createElement('h2');
        titleElement.className = 'text-lg font-semibold';
        titleElement.textContent = title;
        
        const content_div = document.createElement('div');
        content_div.className = 'p-4';
        content_div.appendChild(content);
        
        header.appendChild(titleElement);
        card.appendChild(header);
        card.appendChild(content_div);
        
        return card;
    }

    function createNavigationPreview(navData) {
        if (!navData?.length) return null;
        
        const container = document.createElement('div');
        
        navData.forEach(nav => {
            const preview = document.createElement('div');
            preview.className = 'mb-4 rounded border border-slate-200 bg-white p-4';
            preview.innerHTML = nav.html;
            
            container.appendChild(preview);
            container.appendChild(createCodeBlock(nav.html, 'html'));
        });
        
        return container;
    }

    function createButtonsPreview(buttons) {
        if (!buttons?.length) return null;
        
        const container = document.createElement('div');
        
        buttons.forEach(button => {
            const preview = document.createElement('div');
            preview.className = 'mb-4 rounded border border-slate-200 bg-white p-4';
            preview.innerHTML = button.html;
            
            container.appendChild(preview);
            container.appendChild(createCodeBlock(button.html, 'html'));
            
            if (Object.keys(button.styles).length) {
                const cssCode = Object.entries(button.styles)
                    .map(([key, value]) => `${key}: ${value};`)
                    .join('\n');
                container.appendChild(createCodeBlock(cssCode, 'css'));
            }
        });
        
        return container;
    }

    function createColorSchemePreview(colors) {
        if (!colors?.length) return null;
        
        const container = document.createElement('div');
        const preview = document.createElement('div');
        preview.className = 'mb-4 flex flex-wrap gap-4';
        
        colors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'h-24 w-24 rounded-lg shadow';
            swatch.style.backgroundColor = color;
            preview.appendChild(swatch);
        });
        
        container.appendChild(preview);
        container.appendChild(createCodeBlock(
            `:root {\n${colors.map((color, i) => `  --color-${i + 1}: ${color};`).join('\n')}\n}`,
            'css'
        ));
        
        return container;
    }

    function createTypographyPreview(fonts) {
        if (!fonts?.length) return null;
        
        const container = document.createElement('div');
        const preview = document.createElement('div');
        preview.className = 'mb-4 space-y-4';
        
        fonts.forEach(font => {
            const sample = document.createElement('p');
            sample.style.fontFamily = font;
            sample.textContent = `The quick brown fox jumps over the lazy dog (${font})`;
            preview.appendChild(sample);
        });
        
        container.appendChild(preview);
        container.appendChild(createCodeBlock(
            fonts.map(font => `font-family: ${font};`).join('\n'),
            'css'
        ));
        
        return container;
    }

    function createLayoutPreview(layout) {
        if (!layout?.length) return null;
        
        const container = document.createElement('div');
        
        layout.forEach(element => {
            const preview = document.createElement('div');
            preview.className = 'mb-4 rounded border border-slate-200 bg-white p-4';
            preview.innerHTML = element.html;
            
            container.appendChild(preview);
            container.appendChild(createCodeBlock(element.html, 'html'));
            
            if (element.style) {
                container.appendChild(createCodeBlock(element.style, 'css'));
            }
        });
        
        return container;
    }

    function createIconsPreview(icons) {
        if (!icons?.length) return null;
        
        const container = document.createElement('div');
        const preview = document.createElement('div');
        preview.className = 'mb-4 flex flex-wrap gap-4';
        
        icons.forEach(icon => {
            preview.innerHTML += icon.html;
        });
        
        container.appendChild(preview);
        container.appendChild(createCodeBlock(
            icons.map(icon => icon.html).join('\n'),
            'html'
        ));
        
        return container;
    }

    function createImagesPreview(images) {
        if (!images?.length) return null;
        
        const container = document.createElement('div');
        
        images.forEach(image => {
            const preview = document.createElement('div');
            preview.className = 'mb-4 rounded border border-slate-200 bg-white p-4';
            preview.innerHTML = image.html;
            
            container.appendChild(preview);
            container.appendChild(createCodeBlock(image.html, 'html'));
        });
        
        return container;
    }

    function displayResults(data) {
        resultsSection.innerHTML = '';
        
        const container = document.createElement('div');
        container.className = 'container mx-auto p-6';
        
        // Create sections for each type of design element
        const sections = {
            'Navigation': createNavigationPreview(data.navigation),
            'Buttons': createButtonsPreview(data.buttons),
            'Color Scheme': createColorSchemePreview(data.colors),
            'Typography': createTypographyPreview(data.fonts),
            'Layout': createLayoutPreview(data.layout),
            'Icons': createIconsPreview(data.icons),
            'Images': createImagesPreview(data.images)
        };
        
        Object.entries(sections).forEach(([title, content]) => {
            if (content) {
                container.appendChild(createElementCard(title, content));
            }
        });
        
        resultsSection.appendChild(container);
    }

    function showError(message) {
        const errorElement = errorTemplate.content.cloneNode(true);
        errorElement.querySelector('p').textContent = message;
        resultsSection.innerHTML = '';
        resultsSection.appendChild(errorElement);
    }
});