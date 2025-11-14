# Assets

## Icon Required

⚠️ **IMPORTANT**: You need to add an `icon.png` file to this directory before building the extension.

### Requirements

- File name: `icon.png`
- Recommended size: 512x512px
- Format: PNG
- Background: Transparent or solid color

### How to Create an Icon

1. **Use an emoji** (Quick method):
   - Take a screenshot of an emoji (🌐, 📝, 🔤, etc.)
   - Resize to 512x512px using Preview or online tools
   - Save as `icon.png` in this directory

2. **Use icon generators**:
   - https://www.flaticon.com/
   - https://icon-icons.com/
   - https://www.iconfinder.com/

3. **Create your own**:
   - Use design tools like Figma, Sketch, or Affinity Designer
   - Export as PNG at 512x512px

### Quick Command

```bash
# If you have ImageMagick installed, you can create a simple placeholder:
convert -size 512x512 xc:lightblue -gravity center -pointsize 200 -annotate +0+0 "翻" assets/icon.png
```

Once you add the icon, you can build the extension with:
```bash
npm run build
```
