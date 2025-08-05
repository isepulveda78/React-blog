# Sound Files for React App

## How to Add Sound Files

1. **Add MP3, WAV, or OGG files** to this `/public/sounds/` directory
2. **Reference them** in your React components using the path: `/sounds/filename.mp3`
3. **Use the useSound hook** to play them

## Recommended Sound Files

### Button Sounds
- `button-click.mp3` - Short click sound (100-200ms)
- `button-hover.mp3` - Subtle hover sound (50-100ms)

### Feedback Sounds  
- `success.mp3` - Success/confirmation sound (300-500ms)
- `error.mp3` - Error/warning sound (200-400ms)
- `notification.mp3` - General notification sound (200-300ms)

### Game Sounds
- `coin.mp3` - Collecting item sound
- `jump.mp3` - Action sound
- `powerup.mp3` - Achievement sound

## Free Sound Resources

1. **Freesound.org** - Community-driven sound effects
2. **Zapsplat.com** - Professional sound library (free tier available)
3. **Adobe Audition** - Built-in sound effects
4. **GarageBand** - Built-in sound effects (Mac)

## File Format Recommendations

- **MP3**: Best compatibility, good compression
- **WAV**: Highest quality, larger file size
- **OGG**: Good compression, web-optimized

## File Size Guidelines

- **Button clicks**: 5-20KB
- **Short effects**: 10-50KB  
- **Longer sounds**: 50-200KB
- **Keep total under 1MB** for all sound files

## Example Usage

```javascript
// In your React component
const { sounds, playSound } = window.useSound();

// Play built-in sounds
sounds.buttonClick();
sounds.success();
sounds.error();

// Play custom sound files
playSound('mySound', '/sounds/my-custom-sound.mp3', { volume: 0.5 });
```