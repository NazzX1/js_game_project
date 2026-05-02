export async function createTileLibrary(src, spriteSize = 16) {
    const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = src;
    });

    const sprites = [];
    const cols = img.width / spriteSize;
    const rows = img.height / spriteSize;

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const canvas = document.createElement('canvas');
            canvas.width = spriteSize;
            canvas.height = spriteSize;
            const ctx = canvas.getContext('2d');
            
            // Cut it out!
            ctx.drawImage(
                img, 
                x * spriteSize, y * spriteSize, spriteSize, spriteSize, 
                0, 0, spriteSize, spriteSize
            );
            
            sprites.push(canvas);
        }
    }
    return sprites;
}