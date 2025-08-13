# How to Embed Educational Tools in Blog Posts

## Quick Reference - Copy and paste these into your blog posts:

### Spanish Alphabet Tool
```html
<iframe src="/spanish-alphabet" width="100%" height="600" frameborder="0" style="border: 1px solid #ddd; border-radius: 8px;"></iframe>
```

### Word Sorter Tool
```html
<iframe src="/word-sorter" width="100%" height="700" frameborder="0" style="border: 1px solid #ddd; border-radius: 8px;"></iframe>
```

### Bingo Generator
```html
<iframe src="/bingo-generator" width="100%" height="800" frameborder="0" style="border: 1px solid #ddd; border-radius: 8px;"></iframe>
```

### Listen to Type Tool
```html
<iframe src="/listen-to-type" width="100%" height="600" frameborder="0" style="border: 1px solid #ddd; border-radius: 8px;"></iframe>
```

### Audio Quizzes (Student View)
```html
<iframe src="/audio-quizzes" width="100%" height="800" frameborder="0" style="border: 1px solid #ddd; border-radius: 8px;"></iframe>
```

### Text Quizzes (Student View)
```html
<iframe src="/text-quizzes" width="100%" height="800" frameborder="0" style="border: 1px solid #ddd; border-radius: 8px;"></iframe>
```

### Audio Lists (Student View)
```html
<iframe src="/audio-lists" width="100%" height="700" frameborder="0" style="border: 1px solid #ddd; border-radius: 8px;"></iframe>
```

### Code Evolution Visualization
```html
<iframe src="/code-evolution" width="100%" height="600" frameborder="0" style="border: 1px solid #ddd; border-radius: 8px;"></iframe>
```

### Crossword Generator
```html
<iframe src="/crossword-generator" width="100%" height="700" frameborder="0" style="border: 1px solid #ddd; border-radius: 8px;"></iframe>
```

## How to Use:

1. **Edit your blog post** in the admin panel
2. **Copy one of the iframe codes** above
3. **Paste it directly into your HTML content** where you want the tool to appear
4. **Adjust the height** if needed (change the `height="600"` value)
5. **Save and publish** your post

## Custom Styling:

You can customize the appearance by modifying the iframe style:

```html
<iframe src="/spanish-alphabet" 
        width="100%" 
        height="600" 
        frameborder="0" 
        style="
          border: 2px solid #007bff; 
          border-radius: 12px; 
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          margin: 20px 0;
        ">
</iframe>
```

## Adding Context:

You can add text before and after the embedded tool:

```html
<h3>Practice Your Spanish Alphabet</h3>
<p>Use this interactive tool to hear and practice the Spanish alphabet pronunciation:</p>

<iframe src="/spanish-alphabet" width="100%" height="600" frameborder="0" style="border: 1px solid #ddd; border-radius: 8px;"></iframe>

<p>Click on each letter to hear the correct pronunciation. Practice daily for best results!</p>
```

## Tips:

- **Height adjustment**: Different tools need different heights - experiment to find the perfect fit
- **Responsive design**: Using `width="100%"` makes the embedded tool work on all devices
- **Multiple tools**: You can embed multiple tools in the same blog post
- **Student access**: All these tools work for students when embedded in blog posts