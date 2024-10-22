from flask import Flask, request, jsonify, render_template
from bs4 import BeautifulSoup
import requests
import base64
import re
import cssutils
import json

app = Flask(__name__)

def extract_design_elements(url):
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract website structure
        structure = {
            'header': bool(soup.find('header')),
            'nav': bool(soup.find('nav')),
            'main': bool(soup.find('main')),
            'footer': bool(soup.find('footer')),
            'sidebar': bool(soup.find(['aside', 'div'], class_=lambda x: x and ('sidebar' in str(x).lower()))),
            'sections': len(soup.find_all('section'))
        }
        
        # Extract fonts
        fonts = set()
        style_tags = soup.find_all('style')
        link_tags = soup.find_all('link', rel='stylesheet')
        
        for style in style_tags:
            font_families = re.findall(r'font-family:\s*([^;}]+)', style.string or '')
            fonts.update(font_families)
            
        for link in link_tags:
            if 'fonts' in link.get('href', ''):
                fonts.add(link['href'])
                
        inline_fonts = soup.find_all(style=re.compile(r'font-family'))
        for element in inline_fonts:
            font_families = re.findall(r'font-family:\s*([^;}]+)', element['style'])
            fonts.update(font_families)
        
        # Extract color scheme
        colors = set()
        for tag in soup.find_all(True):
            if tag.get('style'):
                color_values = re.findall(r'(?:color|background-color|border-color):\s*([^;}]+)', tag['style'])
                colors.update(color_values)
                
        for style in style_tags:
            if style.string:
                color_values = re.findall(r'(?:color|background-color|border-color):\s*([^;}]+)', style.string)
                colors.update(color_values)
        
        # Extract buttons with more details
        buttons = []
        button_elements = soup.find_all(['button', 'a'], class_=lambda x: x and ('btn' in str(x).lower() or 'button' in str(x).lower()))
        for button in button_elements:
            style_dict = {}
            if button.get('style'):
                for prop in button['style'].split(';'):
                    if ':' in prop:
                        key, value = prop.split(':')
                        style_dict[key.strip()] = value.strip()
            
            buttons.append({
                'html': str(button),
                'text': button.get_text().strip(),
                'classes': button.get('class', []),
                'styles': style_dict,
                'type': button.name,
                'onclick': button.get('onclick'),
                'href': button.get('href') if button.name == 'a' else None
            })
        
        # Extract navigation with structure
        navigation = []
        nav_elements = soup.find_all(['nav', 'header'])
        for nav in nav_elements:
            nav_structure = {
                'html': str(nav),
                'type': nav.name,
                'classes': nav.get('class', []),
                'items': [],
                'style': nav.get('style')
            }
            
            # Extract navigation items
            items = nav.find_all(['a', 'li'])
            for item in items:
                nav_structure['items'].append({
                    'text': item.get_text().strip(),
                    'href': item.get('href') if item.name == 'a' else None,
                    'classes': item.get('class', []),
                    'html': str(item)
                })
            
            navigation.append(nav_structure)
        
        # Extract layout components
        layout = []
        layout_elements = soup.find_all(['div', 'section', 'article'], class_=True)
        for element in layout_elements:
            if any(term in str(element.get('class', [])).lower() for term in ['container', 'wrapper', 'section', 'grid', 'flex']):
                layout.append({
                    'type': element.name,
                    'classes': element.get('class', []),
                    'style': element.get('style'),
                    'html': str(element)
                })
        
        # Extract icons with metadata
        icons = []
        icon_elements = soup.find_all(['i', 'span', 'svg'], class_=lambda x: x and ('icon' in str(x).lower() or 'fa-' in str(x).lower()))
        for icon in icon_elements:
            icon_data = {
                'html': str(icon),
                'classes': icon.get('class', []),
                'style': icon.get('style'),
                'type': 'font-awesome' if any('fa-' in c for c in icon.get('class', [])) else 'other'
            }
            if icon.name == 'svg':
                icon_data['viewBox'] = icon.get('viewBox')
                icon_data['path'] = str(icon.find('path'))
            icons.append(icon_data)
        
        # Extract images with detailed metadata
        images = []
        img_elements = soup.find_all('img')
        for img in img_elements:
            src = img.get('src', '')
            if src.startswith('data:'):
                image_data = src
            else:
                if not src.startswith(('http://', 'https://')):
                    if src.startswith('//'):
                        src = 'https:' + src
                    elif src.startswith('/'):
                        base_url = '/'.join(url.split('/')[:3])
                        src = base_url + src
                    else:
                        base_url = '/'.join(url.split('/')[:-1])
                        src = base_url + '/' + src
                
                try:
                    img_response = requests.get(src, headers=headers)
                    if img_response.status_code == 200:
                        img_type = img_response.headers.get('content-type', 'image/jpeg')
                        image_data = f"data:{img_type};base64,{base64.b64encode(img_response.content).decode()}"
                except:
                    image_data = None
            
            images.append({
                'html': str(img),
                'src': src,
                'alt': img.get('alt', ''),
                'classes': img.get('class', []),
                'style': img.get('style'),
                'width': img.get('width'),
                'height': img.get('height'),
                'loading': img.get('loading'),
                'data': image_data
            })
        
        return {
            'structure': structure,
            'fonts': list(fonts),
            'colors': list(colors),
            'buttons': buttons,
            'navigation': navigation,
            'layout': layout,
            'icons': icons,
            'images': images
        }
        
    except Exception as e:
        return {'error': str(e)}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/extract', methods=['POST'])
def extract():
    url = request.form.get('url')
    if not url:
        return jsonify({'error': 'No URL provided'})
    
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
        
    design_elements = extract_design_elements(url)
    return jsonify(design_elements)

if __name__ == '__main__':
    app.run(debug=True)