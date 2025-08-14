# Hero Image Management Guide

## How to Change Hero Images

Your hero image system now allows you to easily switch between different images and add new ones.

### Quick Image Switch (For Teachers/Admins)
1. Visit your website's home page
2. You'll see buttons below the text: "Day of the Dead", "Day of the Dead Art", "Education"
3. Click any button to instantly change the hero image
4. Your choice is saved automatically and will persist on future visits

### Adding New Images
To add more hero images:

1. **Add image file**: Put your new image in the `client/img/` folder
   - Supported formats: JPG, JPEG, PNG
   - Recommended size: At least 800x600 pixels for best quality

2. **Update the Hero component**: Edit `client/src/components/Hero.jsx`
   - Find the `heroImages` array (around line 6)
   - Add your new image like this:
   ```javascript
   {
     src: '/img/your-new-image.jpg',
     alt: 'Description of your image',
     name: 'Display Name'
   }
   ```

3. **Save the file** - The image selector buttons will automatically update!

### Current Images Available
- **Day of the Dead** (`/img/day_of_the_dead.jpg`) - Main celebration image
- **Day of the Dead Art** (`/img/day_of_the_dead.jpeg`) - Artistic version
- **Education** - Stock photo for general education content

### Technical Features
- **Instant switching**: No page reload needed
- **Persistent choice**: Your selection is remembered between visits
- **Cache-busting**: New images appear immediately when you replace files
- **Auto-fallback**: If an image fails to load, it automatically tries the next one
- **Admin/Teacher only**: Image selection buttons only appear for authorized users

### Tips
- For best results, use images with a 4:3 or 16:9 aspect ratio
- Keep file sizes reasonable (under 2MB) for faster loading
- Use descriptive alt text for accessibility
- Test images on both desktop and mobile views