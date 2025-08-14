# Hero Image Management Guide

## How to Change Hero Images

Simple code-based hero image switching that works reliably on both development and live sites.

### Changing the Hero Image
To change the hero image, edit `client/src/components/Hero.jsx`:

1. **Find line 6** with the `heroImageSrc` variable
2. **Change the image path** to one of these options:
   ```javascript
   // Option 1: Day of the Dead celebration
   const heroImageSrc = '/img/day_of_the_dead.jpg';
   
   // Option 2: Day of the Dead artwork
   const heroImageSrc = '/img/day_of_the_dead.jpeg';
   
   // Option 3: External stock photo (always works)
   const heroImageSrc = 'https://images.unsplash.com/photo-1667090762902-bd8ee938d3d5?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
   ```

3. **Save the file** - The image will update immediately with cache-busting

### Adding New Images
To use your own images:

1. **Add image file**: Put your new image in the `client/img/` folder
   - Supported formats: JPG, JPEG, PNG
   - Recommended size: At least 800x600 pixels for best quality

2. **Update the code**: Change the `heroImageSrc` variable to your new image:
   ```javascript
   const heroImageSrc = '/img/your-new-image.jpg';
   ```

### Current Images Available
- **Day of the Dead** (`/img/day_of_the_dead.jpg`) - Main celebration image
- **Day of the Dead Art** (`/img/day_of_the_dead.jpeg`) - Artistic version
- **External Education Image** - Stock photo (always works as fallback)

### For Live Site Deployment
When you want to deploy changes to your live site:
1. **Make your image changes** in the Hero.jsx component
2. **Run the deployment build**: `node deploy-with-images.js` (this includes image copying)
3. **Your images will work on the live site** because they're properly copied to the production build

### Technical Features
- **Simple code changes**: Just edit one line to switch images
- **Cache-busting**: New images appear immediately when you replace files
- **Auto-fallback**: If local image fails to load, automatically uses external backup
- **Production build support**: Custom build script ensures images are copied to live site
- **Works reliably**: No complex features that might break in production

### Tips
- For best results, use images with a 4:3 or 16:9 aspect ratio
- Keep file sizes reasonable (under 2MB) for faster loading
- Test your image path works in development first
- Use `node deploy-with-images.js` when building for live site deployment
- External images are reliable but local images load faster