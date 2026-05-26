import sys
from PIL import Image

def process_logo(input_path, output_path):
    # Open the image and convert to RGBA
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()

    new_data = []
    
    # Target color: indigo-400 #818cf8 -> (129, 140, 248)
    target_r, target_g, target_b = 129, 140, 248

    for item in data:
        # item is (r, g, b, a)
        # If it's very close to white, make it transparent
        if item[0] > 200 and item[1] > 200 and item[2] > 200:
            new_data.append((255, 255, 255, 0))
        # If it has some opacity, colorize it
        elif item[3] > 0:
            # We can just flatly color it, or we can use its alpha
            # Assuming it's a solid logo, we just color it to target color 
            # and keep its original alpha
            new_data.append((target_r, target_g, target_b, item[3]))
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Saved processed logo to {output_path}")

if __name__ == "__main__":
    process_logo(sys.argv[1], sys.argv[2])
