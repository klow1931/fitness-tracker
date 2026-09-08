    let dayFoods = []; // in-memory foods for selected date
    let pickedFood = null;
    let html5QrCode = null;
    let scannerRunning = false;

    const DEFAULT_FOODS = [
      // Proteins — meat & fish
      { name: 'Chicken breast (cooked)', serving: '100g', protein: 31, carbs: 0, fat: 3.6, calories: 165, fiber: 0, sugar: 0, sodium: 74 },
      { name: 'Chicken thigh (cooked, skinless)', serving: '100g', protein: 25, carbs: 0, fat: 8, calories: 179, fiber: 0, sugar: 0, sodium: 84 },
      { name: 'Chicken drumstick (cooked)', serving: '1 medium', protein: 12, carbs: 0, fat: 5, calories: 95, fiber: 0, sugar: 0, sodium: 45 },
      { name: 'Turkey breast', serving: '100g', protein: 29, carbs: 0, fat: 1, calories: 135, fiber: 0, sugar: 0, sodium: 50 },
      { name: 'Ground turkey (93% lean)', serving: '100g', protein: 27, carbs: 0, fat: 8, calories: 176, fiber: 0, sugar: 0, sodium: 90 },
      { name: 'Beef (lean ground 90%)', serving: '100g', protein: 26, carbs: 0, fat: 10, calories: 200, fiber: 0, sugar: 0, sodium: 66 },
      { name: 'Beef (sirloin steak)', serving: '100g', protein: 27, carbs: 0, fat: 8, calories: 183, fiber: 0, sugar: 0, sodium: 55 },
      { name: 'Beef (ribeye)', serving: '100g', protein: 24, carbs: 0, fat: 22, calories: 291, fiber: 0, sugar: 0, sodium: 54 },
      { name: 'Pork tenderloin', serving: '100g', protein: 26, carbs: 0, fat: 4, calories: 143, fiber: 0, sugar: 0, sodium: 48 },
      { name: 'Pork chop (lean)', serving: '100g', protein: 25, carbs: 0, fat: 8, calories: 172, fiber: 0, sugar: 0, sodium: 55 },
      { name: 'Bacon (cooked)', serving: '2 slices', protein: 6, carbs: 0.4, fat: 7, calories: 87, fiber: 0, sugar: 0, sodium: 370 },
      { name: 'Ham (sliced)', serving: '50g', protein: 10, carbs: 1, fat: 2.5, calories: 70, fiber: 0, sugar: 1, sodium: 550 },
      { name: 'Salmon (Atlantic)', serving: '100g', protein: 20, carbs: 0, fat: 13, calories: 208, fiber: 0, sugar: 0, sodium: 59 },
      { name: 'Salmon (canned)', serving: '100g', protein: 20, carbs: 0, fat: 7, calories: 142, fiber: 0, sugar: 0, sodium: 400 },
      { name: 'Tuna (canned in water)', serving: '100g', protein: 26, carbs: 0, fat: 1, calories: 116, fiber: 0, sugar: 0, sodium: 320 },
      { name: 'Tuna (canned in oil)', serving: '100g', protein: 25, carbs: 0, fat: 8, calories: 186, fiber: 0, sugar: 0, sodium: 350 },
      { name: 'Cod (baked)', serving: '100g', protein: 20, carbs: 0, fat: 0.7, calories: 82, fiber: 0, sugar: 0, sodium: 78 },
      { name: 'Tilapia (cooked)', serving: '100g', protein: 26, carbs: 0, fat: 2.7, calories: 128, fiber: 0, sugar: 0, sodium: 56 },
      { name: 'Shrimp (cooked)', serving: '100g', protein: 24, carbs: 0.2, fat: 0.3, calories: 99, fiber: 0, sugar: 0, sodium: 111 },
      { name: 'Sardines (canned in oil)', serving: '100g', protein: 25, carbs: 0, fat: 11, calories: 208, fiber: 0, sugar: 0, sodium: 307 },
      // Eggs & dairy
      { name: 'Eggs (whole)', serving: '1 large', protein: 6.3, carbs: 0.4, fat: 5, calories: 72, fiber: 0, sugar: 0.2, sodium: 71 },
      { name: 'Egg whites', serving: '100g', protein: 11, carbs: 0.7, fat: 0.2, calories: 52, fiber: 0, sugar: 0.7, sodium: 166 },
      { name: 'Greek yogurt (nonfat)', serving: '170g', protein: 17, carbs: 6, fat: 0.7, calories: 100, fiber: 0, sugar: 6, sodium: 60 },
      { name: 'Greek yogurt (2%)', serving: '170g', protein: 16, carbs: 6, fat: 3.5, calories: 130, fiber: 0, sugar: 5, sodium: 55 },
      { name: 'Regular yogurt (plain)', serving: '170g', protein: 9, carbs: 12, fat: 4, calories: 120, fiber: 0, sugar: 12, sodium: 100 },
      { name: 'Cottage cheese (low-fat)', serving: '100g', protein: 11, carbs: 3.4, fat: 1, calories: 72, fiber: 0, sugar: 2.7, sodium: 364 },
      { name: 'Cottage cheese (full-fat)', serving: '100g', protein: 11, carbs: 3.4, fat: 4.3, calories: 98, fiber: 0, sugar: 2.7, sodium: 364 },
      { name: 'Whole milk', serving: '240ml (1 cup)', protein: 8, carbs: 12, fat: 8, calories: 150, fiber: 0, sugar: 12, sodium: 105 },
      { name: '2% milk', serving: '240ml (1 cup)', protein: 8, carbs: 12, fat: 5, calories: 122, fiber: 0, sugar: 12, sodium: 115 },
      { name: 'Skim milk', serving: '240ml (1 cup)', protein: 8, carbs: 12, fat: 0.2, calories: 83, fiber: 0, sugar: 12, sodium: 103 },
      { name: 'Almond milk (unsweetened)', serving: '240ml', protein: 1, carbs: 1, fat: 2.5, calories: 30, fiber: 0, sugar: 0, sodium: 150 },
      { name: 'Oat milk', serving: '240ml', protein: 3, carbs: 16, fat: 5, calories: 120, fiber: 2, sugar: 7, sodium: 100 },
      { name: 'Soy milk (unsweetened)', serving: '240ml', protein: 7, carbs: 4, fat: 4, calories: 80, fiber: 1, sugar: 1, sodium: 90 },
      { name: 'Cheddar cheese', serving: '28g (1 oz)', protein: 7, carbs: 0.4, fat: 9, calories: 114, fiber: 0, sugar: 0.1, sodium: 180 },
      { name: 'Mozzarella (part-skim)', serving: '28g (1 oz)', protein: 7, carbs: 1, fat: 5, calories: 72, fiber: 0, sugar: 0.5, sodium: 175 },
      { name: 'Parmesan', serving: '15g', protein: 5.4, carbs: 0.5, fat: 4.3, calories: 63, fiber: 0, sugar: 0.1, sodium: 228 },
      { name: 'Feta cheese', serving: '28g', protein: 4, carbs: 1.1, fat: 6, calories: 75, fiber: 0, sugar: 1, sodium: 316 },
      { name: 'Cream cheese', serving: '2 tbsp (30g)', protein: 2, carbs: 2, fat: 10, calories: 100, fiber: 0, sugar: 2, sodium: 105 },
      { name: 'Butter', serving: '1 tbsp', protein: 0.1, carbs: 0, fat: 11.5, calories: 102, fiber: 0, sugar: 0, sodium: 91 },
      // Plant proteins
      { name: 'Tofu (firm)', serving: '100g', protein: 8, carbs: 2, fat: 4.5, calories: 76, fiber: 0.3, sugar: 0.6, sodium: 14 },
      { name: 'Tempeh', serving: '100g', protein: 19, carbs: 9, fat: 11, calories: 193, fiber: 0, sugar: 0, sodium: 9 },
      { name: 'Edamame (shelled)', serving: '100g', protein: 12, carbs: 9, fat: 5, calories: 121, fiber: 5, sugar: 2.2, sodium: 6 },
      { name: 'Lentils (cooked)', serving: '100g', protein: 9, carbs: 20, fat: 0.4, calories: 116, fiber: 8, sugar: 1.8, sodium: 2 },
      { name: 'Black beans (cooked)', serving: '100g', protein: 8.9, carbs: 24, fat: 0.5, calories: 132, fiber: 8.7, sugar: 0.3, sodium: 1 },
      { name: 'Chickpeas (cooked)', serving: '100g', protein: 8.9, carbs: 27, fat: 2.6, calories: 164, fiber: 7.6, sugar: 4.8, sodium: 7 },
      { name: 'Kidney beans (cooked)', serving: '100g', protein: 8.7, carbs: 23, fat: 0.5, calories: 127, fiber: 6.4, sugar: 0.3, sodium: 2 },
      { name: 'Pinto beans (cooked)', serving: '100g', protein: 9, carbs: 26, fat: 0.7, calories: 143, fiber: 9, sugar: 0.3, sodium: 1 },
      { name: 'Seitan', serving: '100g', protein: 25, carbs: 4, fat: 1.9, calories: 120, fiber: 0.6, sugar: 0, sodium: 29 },
      // Carbs — grains & starches
      { name: 'Oats (dry)', serving: '40g', protein: 5.4, carbs: 27, fat: 2.6, calories: 150, fiber: 4, sugar: 0.4, sodium: 2 },
      { name: 'Oatmeal (cooked)', serving: '1 cup', protein: 5.5, carbs: 27, fat: 3, calories: 150, fiber: 4, sugar: 1, sodium: 5 },
      { name: 'Brown rice (cooked)', serving: '100g', protein: 2.6, carbs: 23, fat: 0.9, calories: 112, fiber: 1.8, sugar: 0.4, sodium: 5 },
      { name: 'White rice (cooked)', serving: '100g', protein: 2.7, carbs: 28, fat: 0.3, calories: 130, fiber: 0.4, sugar: 0.1, sodium: 1 },
      { name: 'Jasmine rice (cooked)', serving: '100g', protein: 2.7, carbs: 28, fat: 0.2, calories: 129, fiber: 0.4, sugar: 0, sodium: 1 },
      { name: 'Quinoa (cooked)', serving: '100g', protein: 4.4, carbs: 21, fat: 1.9, calories: 120, fiber: 2.8, sugar: 0.9, sodium: 7 },
      { name: 'Couscous (cooked)', serving: '100g', protein: 3.8, carbs: 23, fat: 0.2, calories: 112, fiber: 1.4, sugar: 0.1, sodium: 5 },
      { name: 'Pasta (cooked)', serving: '100g', protein: 5, carbs: 25, fat: 0.9, calories: 131, fiber: 1.8, sugar: 0.6, sodium: 1 },
      { name: 'Whole wheat pasta (cooked)', serving: '100g', protein: 5.8, carbs: 26, fat: 0.5, calories: 124, fiber: 3.9, sugar: 0.8, sodium: 3 },
      { name: 'Bread (whole wheat)', serving: '1 slice (28g)', protein: 3.5, carbs: 12, fat: 1, calories: 70, fiber: 2, sugar: 1.5, sodium: 130 },
      { name: 'Bread (white)', serving: '1 slice (28g)', protein: 2.5, carbs: 13, fat: 1, calories: 70, fiber: 0.7, sugar: 1.5, sodium: 140 },
      { name: 'Sourdough bread', serving: '1 slice (40g)', protein: 3.5, carbs: 18, fat: 0.5, calories: 90, fiber: 1, sugar: 1, sodium: 180 },
      { name: 'Bagel', serving: '1 medium', protein: 10, carbs: 55, fat: 1.5, calories: 270, fiber: 2, sugar: 6, sodium: 450 },
      { name: 'English muffin', serving: '1 muffin', protein: 4.5, carbs: 26, fat: 1, calories: 130, fiber: 1.5, sugar: 2, sodium: 250 },
      { name: 'Tortilla (flour, 8\")', serving: '1 tortilla', protein: 4, carbs: 25, fat: 4, calories: 150, fiber: 1, sugar: 1, sodium: 320 },
      { name: 'Tortilla (corn)', serving: '1 tortilla', protein: 1.4, carbs: 11, fat: 0.7, calories: 52, fiber: 1.5, sugar: 0.4, sodium: 11 },
      { name: 'Potato (baked)', serving: '100g', protein: 2.5, carbs: 21, fat: 0.1, calories: 93, fiber: 2.2, sugar: 1.2, sodium: 10 },
      { name: 'Sweet potato (baked)', serving: '100g', protein: 2, carbs: 20.7, fat: 0.2, calories: 90, fiber: 3.3, sugar: 6.5, sodium: 36 },
      { name: 'French fries', serving: '100g', protein: 3.4, carbs: 38, fat: 15, calories: 312, fiber: 3.5, sugar: 0.3, sodium: 210 },
      { name: 'Hash browns', serving: '100g', protein: 2.5, carbs: 28, fat: 9, calories: 206, fiber: 2.5, sugar: 1, sodium: 350 },
      // Fruits
      { name: 'Banana', serving: '1 medium', protein: 1.3, carbs: 27, fat: 0.4, calories: 105, fiber: 3.1, sugar: 14, sodium: 1 },
      { name: 'Apple', serving: '1 medium', protein: 0.5, carbs: 25, fat: 0.3, calories: 95, fiber: 4.4, sugar: 19, sodium: 2 },
      { name: 'Orange', serving: '1 medium', protein: 1.2, carbs: 15, fat: 0.2, calories: 62, fiber: 3.1, sugar: 12, sodium: 0 },
      { name: 'Strawberries', serving: '100g', protein: 0.7, carbs: 8, fat: 0.3, calories: 32, fiber: 2, sugar: 4.9, sodium: 1 },
      { name: 'Blueberries', serving: '100g', protein: 0.7, carbs: 14, fat: 0.3, calories: 57, fiber: 2.4, sugar: 10, sodium: 1 },
      { name: 'Grapes', serving: '100g', protein: 0.7, carbs: 18, fat: 0.2, calories: 69, fiber: 0.9, sugar: 16, sodium: 2 },
      { name: 'Mango', serving: '100g', protein: 0.8, carbs: 15, fat: 0.4, calories: 60, fiber: 1.6, sugar: 14, sodium: 1 },
      { name: 'Pineapple', serving: '100g', protein: 0.5, carbs: 13, fat: 0.1, calories: 50, fiber: 1.4, sugar: 10, sodium: 1 },
      { name: 'Watermelon', serving: '100g', protein: 0.6, carbs: 8, fat: 0.2, calories: 30, fiber: 0.4, sugar: 6, sodium: 1 },
      { name: 'Pear', serving: '1 medium', protein: 0.6, carbs: 27, fat: 0.2, calories: 101, fiber: 5.5, sugar: 17, sodium: 2 },
      { name: 'Peach', serving: '1 medium', protein: 1, carbs: 15, fat: 0.4, calories: 59, fiber: 2.3, sugar: 13, sodium: 0 },
      { name: 'Kiwi', serving: '1 fruit', protein: 0.8, carbs: 10, fat: 0.4, calories: 42, fiber: 2.1, sugar: 6, sodium: 2 },
      { name: 'Dates (Medjool)', serving: '2 dates', protein: 0.8, carbs: 36, fat: 0.1, calories: 133, fiber: 3.2, sugar: 32, sodium: 1 },
      { name: 'Raisins', serving: '40g (small box)', protein: 1.2, carbs: 32, fat: 0.2, calories: 120, fiber: 1.5, sugar: 26, sodium: 5 },
      // Vegetables
      { name: 'Broccoli (cooked)', serving: '100g', protein: 2.4, carbs: 7, fat: 0.4, calories: 35, fiber: 3.3, sugar: 1.4, sodium: 41 },
      { name: 'Spinach (raw)', serving: '100g', protein: 2.9, carbs: 3.6, fat: 0.4, calories: 23, fiber: 2.2, sugar: 0.4, sodium: 79 },
      { name: 'Kale (raw)', serving: '100g', protein: 4.3, carbs: 9, fat: 0.9, calories: 49, fiber: 3.6, sugar: 2.3, sodium: 38 },
      { name: 'Asparagus (cooked)', serving: '100g', protein: 2.4, carbs: 4, fat: 0.2, calories: 22, fiber: 2.1, sugar: 1.3, sodium: 14 },
      { name: 'Green beans (cooked)', serving: '100g', protein: 1.9, carbs: 8, fat: 0.1, calories: 35, fiber: 3.2, sugar: 1.5, sodium: 1 },
      { name: 'Carrots (raw)', serving: '100g', protein: 0.9, carbs: 10, fat: 0.2, calories: 41, fiber: 2.8, sugar: 4.7, sodium: 69 },
      { name: 'Bell pepper (red)', serving: '100g', protein: 1, carbs: 6, fat: 0.3, calories: 31, fiber: 2.1, sugar: 4.2, sodium: 4 },
      { name: 'Tomato', serving: '1 medium', protein: 1.1, carbs: 5, fat: 0.2, calories: 22, fiber: 1.5, sugar: 3.2, sodium: 6 },
      { name: 'Cucumber', serving: '100g', protein: 0.7, carbs: 3.6, fat: 0.1, calories: 15, fiber: 0.5, sugar: 1.7, sodium: 2 },
      { name: 'Zucchini (cooked)', serving: '100g', protein: 1.1, carbs: 3, fat: 0.4, calories: 17, fiber: 1, sugar: 1.5, sodium: 3 },
      { name: 'Cauliflower (cooked)', serving: '100g', protein: 1.8, carbs: 4, fat: 0.5, calories: 23, fiber: 2.3, sugar: 1.5, sodium: 15 },
      { name: 'Brussels sprouts (cooked)', serving: '100g', protein: 3.4, carbs: 9, fat: 0.5, calories: 43, fiber: 3.5, sugar: 2.2, sodium: 21 },
      { name: 'Mushrooms (white)', serving: '100g', protein: 3.1, carbs: 3.3, fat: 0.3, calories: 22, fiber: 1, sugar: 2, sodium: 5 },
      { name: 'Onion', serving: '100g', protein: 1.1, carbs: 9, fat: 0.1, calories: 40, fiber: 1.7, sugar: 4.2, sodium: 4 },
      { name: 'Garlic', serving: '3 cloves', protein: 0.6, carbs: 3, fat: 0, calories: 13, fiber: 0.2, sugar: 0.1, sodium: 1 },
      { name: 'Corn (sweet, cooked)', serving: '100g', protein: 3.3, carbs: 21, fat: 1.5, calories: 96, fiber: 2.4, sugar: 4.5, sodium: 1 },
      { name: 'Peas (cooked)', serving: '100g', protein: 5.4, carbs: 14, fat: 0.4, calories: 81, fiber: 5.5, sugar: 5.7, sodium: 3 },
      { name: 'Mixed salad greens', serving: '2 cups', protein: 1.5, carbs: 3, fat: 0.2, calories: 15, fiber: 1.5, sugar: 1, sodium: 20 },
      // Nuts, seeds, fats
      { name: 'Almonds', serving: '28g (1 oz)', protein: 6, carbs: 6, fat: 14, calories: 164, fiber: 3.5, sugar: 1.2, sodium: 0 },
      { name: 'Walnuts', serving: '28g (1 oz)', protein: 4.3, carbs: 4, fat: 18, calories: 185, fiber: 1.9, sugar: 0.7, sodium: 1 },
      { name: 'Cashews', serving: '28g (1 oz)', protein: 5, carbs: 9, fat: 12, calories: 157, fiber: 0.9, sugar: 1.7, sodium: 3 },
      { name: 'Peanuts', serving: '28g (1 oz)', protein: 7, carbs: 4.5, fat: 14, calories: 161, fiber: 2.4, sugar: 1.3, sodium: 2 },
      { name: 'Peanut butter', serving: '2 tbsp (32g)', protein: 7, carbs: 6, fat: 16, calories: 190, fiber: 2, sugar: 3, sodium: 140 },
      { name: 'Almond butter', serving: '2 tbsp (32g)', protein: 6, carbs: 6, fat: 17, calories: 190, fiber: 3, sugar: 1, sodium: 0 },
      { name: 'Chia seeds', serving: '15g (1 tbsp)', protein: 2.5, carbs: 6, fat: 4.5, calories: 70, fiber: 5, sugar: 0, sodium: 2 },
      { name: 'Flax seeds (ground)', serving: '15g', protein: 2.5, carbs: 4, fat: 6, calories: 75, fiber: 4, sugar: 0.2, sodium: 4 },
      { name: 'Pumpkin seeds', serving: '28g', protein: 8.5, carbs: 5, fat: 13, calories: 151, fiber: 1.7, sugar: 0.4, sodium: 5 },
      { name: 'Sunflower seeds', serving: '28g', protein: 5.5, carbs: 5.5, fat: 14, calories: 164, fiber: 2.5, sugar: 0.7, sodium: 1 },
      { name: 'Avocado', serving: '1/2 fruit', protein: 2, carbs: 9, fat: 15, calories: 160, fiber: 7, sugar: 0.7, sodium: 7 },
      { name: 'Olive oil', serving: '1 tbsp', protein: 0, carbs: 0, fat: 14, calories: 119, fiber: 0, sugar: 0, sodium: 0 },
      { name: 'Coconut oil', serving: '1 tbsp', protein: 0, carbs: 0, fat: 14, calories: 120, fiber: 0, sugar: 0, sodium: 0 },
      { name: 'Canola oil', serving: '1 tbsp', protein: 0, carbs: 0, fat: 14, calories: 124, fiber: 0, sugar: 0, sodium: 0 },
      // Convenience & restaurant-style
      { name: 'White rice bowl (restaurant)', serving: '1 cup cooked', protein: 4, carbs: 45, fat: 0.5, calories: 200, fiber: 0.6, sugar: 0, sodium: 5 },
      { name: 'Pizza (cheese, slice)', serving: '1 slice', protein: 12, carbs: 34, fat: 10, calories: 285, fiber: 2, sugar: 4, sodium: 640 },
      { name: 'Burger (beef, no cheese)', serving: '1 sandwich', protein: 25, carbs: 30, fat: 20, calories: 400, fiber: 1.5, sugar: 6, sodium: 600 },
      { name: 'Cheeseburger', serving: '1 sandwich', protein: 28, carbs: 31, fat: 25, calories: 460, fiber: 1.5, sugar: 7, sodium: 780 },
      { name: 'Chicken sandwich (breaded)', serving: '1 sandwich', protein: 25, carbs: 40, fat: 18, calories: 440, fiber: 2, sugar: 5, sodium: 900 },
      { name: 'Sushi roll (California)', serving: '6–8 pieces', protein: 9, carbs: 38, fat: 7, calories: 255, fiber: 3, sugar: 6, sodium: 500 },
      { name: 'Ramen (instant, prepared)', serving: '1 package', protein: 9, carbs: 52, fat: 14, calories: 380, fiber: 2, sugar: 2, sodium: 1600 },
      { name: 'Burrito (bean & cheese)', serving: '1 burrito', protein: 18, carbs: 55, fat: 15, calories: 420, fiber: 8, sugar: 3, sodium: 900 },
      { name: 'Tacos (beef, 2 soft)', serving: '2 tacos', protein: 18, carbs: 28, fat: 16, calories: 330, fiber: 3, sugar: 2, sodium: 550 },
      { name: 'Pad Thai', serving: '1 serving (~300g)', protein: 18, carbs: 55, fat: 16, calories: 450, fiber: 3, sugar: 12, sodium: 1100 },
      // Snacks & sweets
      { name: 'Protein bar (typical)', serving: '1 bar (60g)', protein: 20, carbs: 22, fat: 7, calories: 220, fiber: 5, sugar: 8, sodium: 180 },
      { name: 'Granola bar', serving: '1 bar (25g)', protein: 2, carbs: 18, fat: 4, calories: 110, fiber: 1.5, sugar: 8, sodium: 70 },
      { name: 'Rice cakes (plain)', serving: '2 cakes', protein: 1, carbs: 14, fat: 0.3, calories: 70, fiber: 0.4, sugar: 0, sodium: 20 },
      { name: 'Popcorn (air-popped)', serving: '3 cups', protein: 3, carbs: 19, fat: 1.2, calories: 90, fiber: 3.5, sugar: 0.2, sodium: 2 },
      { name: 'Dark chocolate (70%)', serving: '30g', protein: 2.5, carbs: 13, fat: 13, calories: 170, fiber: 3.5, sugar: 7, sodium: 5 },
      { name: 'Ice cream (vanilla)', serving: '1/2 cup', protein: 2.5, carbs: 16, fat: 7, calories: 137, fiber: 0, sugar: 14, sodium: 50 },
      { name: 'Honey', serving: '1 tbsp', protein: 0, carbs: 17, fat: 0, calories: 64, fiber: 0, sugar: 17, sodium: 1 },
      { name: 'Maple syrup', serving: '1 tbsp', protein: 0, carbs: 13, fat: 0, calories: 52, fiber: 0, sugar: 12, sodium: 2 },
      { name: 'Table sugar', serving: '1 tbsp', protein: 0, carbs: 12.5, fat: 0, calories: 48, fiber: 0, sugar: 12.5, sodium: 0 },
      // Supplements & drinks
      { name: 'Whey protein powder', serving: '1 scoop (30g)', protein: 24, carbs: 3, fat: 1.5, calories: 120, fiber: 0, sugar: 1, sodium: 50 },
      { name: 'Casein protein powder', serving: '1 scoop (30g)', protein: 24, carbs: 3, fat: 1, calories: 120, fiber: 1, sugar: 1, sodium: 60 },
      { name: 'Plant protein powder', serving: '1 scoop (30g)', protein: 20, carbs: 5, fat: 2, calories: 120, fiber: 2, sugar: 1, sodium: 200 },
      { name: 'Creatine monohydrate', serving: '5g', protein: 0, carbs: 0, fat: 0, calories: 0, fiber: 0, sugar: 0, sodium: 0 },
      { name: 'Coffee (black)', serving: '240ml', protein: 0.3, carbs: 0, fat: 0, calories: 2, fiber: 0, sugar: 0, sodium: 5 },
      { name: 'Tea (black, plain)', serving: '240ml', protein: 0, carbs: 0, fat: 0, calories: 2, fiber: 0, sugar: 0, sodium: 5 },
      { name: 'Green tea', serving: '240ml', protein: 0, carbs: 0, fat: 0, calories: 2, fiber: 0, sugar: 0, sodium: 2 },
      { name: 'Orange juice', serving: '240ml', protein: 1.7, carbs: 26, fat: 0.5, calories: 110, fiber: 0.5, sugar: 21, sodium: 2 },
      { name: 'Apple juice', serving: '240ml', protein: 0.2, carbs: 28, fat: 0.3, calories: 114, fiber: 0.2, sugar: 24, sodium: 10 },
      { name: 'Gatorade / sports drink', serving: '240ml', protein: 0, carbs: 14, fat: 0, calories: 50, fiber: 0, sugar: 14, sodium: 110 },
      { name: 'Cola / soda', serving: '355ml can', protein: 0, carbs: 39, fat: 0, calories: 140, fiber: 0, sugar: 39, sodium: 45 },
      { name: 'Beer (regular)', serving: '355ml', protein: 1.6, carbs: 13, fat: 0, calories: 153, fiber: 0, sugar: 0, sodium: 14 },
      { name: 'Wine (red)', serving: '150ml glass', protein: 0.1, carbs: 4, fat: 0, calories: 125, fiber: 0, sugar: 1, sodium: 5 },
      // Breakfast favorites
      { name: 'Pancakes (from mix)', serving: '3 medium', protein: 8, carbs: 50, fat: 6, calories: 280, fiber: 1.5, sugar: 10, sodium: 550 },
      { name: 'Waffle (frozen)', serving: '1 waffle', protein: 3, carbs: 18, fat: 4, calories: 120, fiber: 0.5, sugar: 3, sodium: 220 },
      { name: 'Cereal (corn flakes)', serving: '1 cup', protein: 2, carbs: 24, fat: 0.2, calories: 100, fiber: 1, sugar: 3, sodium: 200 },
      { name: 'Cereal (oat / granola)', serving: '1/2 cup', protein: 5, carbs: 32, fat: 6, calories: 200, fiber: 4, sugar: 12, sodium: 50 },
      { name: 'Breakfast sausage', serving: '2 links', protein: 8, carbs: 1, fat: 12, calories: 140, fiber: 0, sugar: 0, sodium: 340 },
      { name: 'Hash brown patty', serving: '1 patty', protein: 1.5, carbs: 15, fat: 9, calories: 140, fiber: 1.5, sugar: 0.5, sodium: 280 }
    ];

    function ensureFoodLibrary() {
      data.foodLibrary = data.foodLibrary || [];
      if (data.foodLibrary.length === 0) {
        data.foodLibrary = DEFAULT_FOODS.map((f, i) => ({ id: 'default-' + i, ...f, source: 'builtin' }));
        saveData(data);
        return;
      }
      // Merge any new built-in foods for users who already have a library
      const existing = new Set(data.foodLibrary.map(f => (f.name || '').toLowerCase()));
      let added = 0;
      DEFAULT_FOODS.forEach((f, i) => {
        const key = (f.name || '').toLowerCase();
        if (!existing.has(key)) {
          data.foodLibrary.push({ id: 'default-' + i + '-' + Date.now(), ...f, source: 'builtin' });
          existing.add(key);
          added++;
        }
      });
      if (added) saveData(data);
    }

    function showFoodMode(mode) {
      ['search', 'barcode', 'manual', 'custom'].forEach(m => {
        const el = document.getElementById('food-mode-' + m);
        if (el) el.classList.toggle('hidden', m !== mode);
        const btn = document.getElementById('mode-' + m);
        if (btn) {
          btn.className = m === mode ? 'btn-primary text-sm' : 'btn-secondary text-sm';
        }
      });
      if (mode !== 'barcode' && scannerRunning) stopBarcodeScanner();
      if (mode === 'search') searchFoodLibrary();
    }

    const debouncedFoodSearch = debounce(() => searchFoodLibrary(), 150);
    const debouncedLibraryFilter = debounce(() => renderFoodLibrary(), 150);

    const FOOD_ROW_EST = 44;
    const FOOD_OVERSCAN = 8;
    const FOOD_VIEWPORT = 256;
    let _foodSearchList = [];
    let _foodLibList = [];
    let _foodSearchScroll = null;
    let _foodLibScroll = null;

    function foodRowHtml(f, compact) {
      const id = escapeHtml(f.id);
      f=Object.fromEntries(Object.entries(f).map(([key,value])=>[key,escapeHtml(value ?? '')]));
      if (compact) {
        return `
        <div class="flex justify-between items-center border border-slate-200 rounded px-2 py-1.5 hover:bg-slate-50 cursor-pointer" data-id="${id}" onclick="pickFoodById(this.dataset.id)">
          <div>
            <span class="font-medium">${f.name}</span>
            <span class="text-slate-500 text-xs ml-1">${f.serving || ''}</span>
          </div>
          <span class="text-xs text-slate-500">P${f.protein} C${f.carbs} F${f.fat} · ${f.calories}kcal</span>
        </div>`;
      }
      return `
        <div class="flex justify-between items-center border border-slate-200 rounded px-2 py-1">
          <div class="cursor-pointer flex-1" data-id="${id}" onclick="pickFoodById(this.dataset.id)">
            <span class="font-medium">${f.name}</span>
            <span class="text-xs text-slate-500 ml-1">${f.serving || ''} · ${f.calories}kcal</span>
          </div>
          <button data-id="${id}" onclick="editLibraryFood(this.dataset.id)" class="btn-secondary text-xs">Edit</button>
          ${f.barcode ? `<button data-id="${id}" onclick="refreshBarcodeFood(this.dataset.id)" class="btn-secondary text-xs">Refresh / compare label</button>` : ''}
          ${f.source === 'custom' || f.source === 'barcode' || f.source === 'openfoodfacts' ? `<button data-id="${id}" onclick="deleteLibraryFood(this.dataset.id)" class="btn-danger text-xs">✕</button>` : ''}
        </div>`;
    }

    function paintFoodVirtual(scrollEl, list, compact) {
      if (!scrollEl) return;
      const inner = scrollEl.querySelector('[data-virt-inner]');
      if (!inner) return;
      const total = list.length;
      if (!total) {
        inner.innerHTML = '';
        return;
      }
      const scrollTop = scrollEl.scrollTop;
      const viewH = scrollEl.clientHeight || FOOD_VIEWPORT;
      let start = Math.floor(scrollTop / FOOD_ROW_EST) - FOOD_OVERSCAN;
      if (start < 0) start = 0;
      let end = Math.ceil((scrollTop + viewH) / FOOD_ROW_EST) + FOOD_OVERSCAN;
      if (end > total) end = total;
      const topPad = start * FOOD_ROW_EST;
      const bottomPad = (total - end) * FOOD_ROW_EST;
      inner.innerHTML =
        `<div style="height:${topPad}px"></div>` +
        list.slice(start, end).map(f => foodRowHtml(f, compact)).join('') +
        `<div style="height:${bottomPad}px"></div>`;
    }

    const onFoodSearchScroll = debounce(() => paintFoodVirtual(_foodSearchScroll, _foodSearchList, true), 16);
    const onFoodLibScroll = debounce(() => paintFoodVirtual(_foodLibScroll, _foodLibList, false), 16);

    function mountFoodVirtual(container, list, compact, which) {
      if (list.length <= 40) {
        container.innerHTML = list.map(f => foodRowHtml(f, compact)).join('');
        if (which === 'search') _foodSearchScroll = null;
        else _foodLibScroll = null;
        return;
      }
      container.innerHTML = `
        <p class="text-xs text-slate-500 mb-1">${list.length} items · virtualized</p>
        <div data-food-virt-scroll style="max-height:${FOOD_VIEWPORT}px;overflow-y:auto;">
          <div data-virt-inner></div>
        </div>`;
      const sc = container.querySelector('[data-food-virt-scroll]');
      if (which === 'search') {
        _foodSearchScroll = sc;
        _foodSearchList = list;
        sc.removeEventListener('scroll', onFoodSearchScroll);
        sc.addEventListener('scroll', onFoodSearchScroll, { passive: true });
      } else {
        _foodLibScroll = sc;
        _foodLibList = list;
        sc.removeEventListener('scroll', onFoodLibScroll);
        sc.addEventListener('scroll', onFoodLibScroll, { passive: true });
      }
      paintFoodVirtual(sc, list, compact);
    }

    function searchFoodLibrary() {
      ensureFoodLibrary();
      const q = (document.getElementById('food-search')?.value || '').toLowerCase().trim();
      const results = document.getElementById('food-search-results');
      if (!results) return;
      let list = data.foodLibrary;
      if (q) list = list.filter(f => f.name.toLowerCase().includes(q) || (f.brand || '').toLowerCase().includes(q));
      if (!list.length) {
        results.innerHTML = '<p class="text-slate-500">No foods found.</p>';
        _foodSearchScroll = null;
        return;
      }
      mountFoodVirtual(results, list, true, 'search');
    }

    function pickFoodById(id) {
      ensureFoodLibrary();
      const f = data.foodLibrary.find(x => String(x.id) === String(id));
      if (f) pickFood(f);
    }

    function pickFood(f) {
      pickedFood = f;
      document.getElementById('food-serving-picker').classList.remove('hidden');
      document.getElementById('picked-food-name').textContent = f.name + (f.brand ? ' (' + f.brand + ')' : '');
      document.getElementById('picked-servings').value = 1;
      const basis=LoadnoteNutrition.basis(f);
      document.getElementById('picked-unit').innerHTML='<option value="servings">Servings</option>'+(basis.servingUnit?'<option value="'+basis.servingUnit+'">'+basis.servingUnit+'</option>':'');
      const microBits = MICRO_FIELDS
        .filter(({ key }) => f[key])
        .map(({ key, unit }) => `${key === 'satFat' ? 'Sat' : key}: ${f[key]}${unit}`)
        .slice(0, 6)
        .join(' · ');
      document.getElementById('picked-food-info').textContent =
        `Per serving (${f.serving || '1'}): ${f.calories ?? 'Unknown'} kcal · P ${f.protein ?? 'Unknown'}g · C ${f.carbs ?? 'Unknown'}g · F ${f.fat ?? 'Unknown'}g` +
        (microBits ? ' · ' + microBits : '');
    }

    function cancelPickedFood() {
      pickedFood = null;
      document.getElementById('food-serving-picker').classList.add('hidden');
    }

    const MICRO_FIELDS = [
      { key: 'fiber', unit: 'g', decimals: 1 },
      { key: 'sugar', unit: 'g', decimals: 1 },
      { key: 'satFat', unit: 'g', decimals: 1 },
      { key: 'cholesterol', unit: 'mg', decimals: 0 },
      { key: 'sodium', unit: 'mg', decimals: 0 },
      { key: 'potassium', unit: 'mg', decimals: 0 },
      { key: 'calcium', unit: 'mg', decimals: 0 },
      { key: 'iron', unit: 'mg', decimals: 1 },
      { key: 'vitaminC', unit: 'mg', decimals: 1 },
      { key: 'vitaminD', unit: 'µg', decimals: 1 },
      { key: 'magnesium', unit: 'mg', decimals: 0 }
    ];

    function round1(n) { return Math.round(n * 10) / 10; }
    function roundN(n, d) {
      const m = Math.pow(10, d);
      return Math.round((n || 0) * m) / m;
    }

    function scaleFoodEntry(f, servings) { return LoadnoteNutrition.scale(f, servings); }

    function sumDayFoods(list) { return LoadnoteNutrition.totals(list || []); }

    function confirmAddFood() {
      if (!pickedFood) return;
      try {
        const quantity=LoadnoteNutrition.portion(pickedFood,document.getElementById('picked-servings').value,document.getElementById('picked-unit').value);
        dayFoods.push(scaleFoodEntry(pickedFood,quantity));
        cancelPickedFood();
        commitNutritionDay();
      } catch (error) { showToast(error.message, 'error'); }
    }

    function removeDayFood(id) {
      dayFoods = dayFoods.filter(f => String(f.id) !== String(id));
      commitNutritionDay();
    }
    function editDayFood(id) {
      const entry=dayFoods.find(f=>String(f.id)===String(id));
      if(!entry) return;
      openNutritionEditor(entry,'day');
    }
    function nutritionValue(value, unit='') {
      return LoadnoteNutrition.number(value)===null ? 'Unknown' : escapeHtml(round1(Number(value))+unit);
    }

    function renderDayFoods() {
      const list=document.getElementById('day-foods-list');
      if(!list) return;
      list.innerHTML=dayFoods.length ? dayFoods.map(f=>`
        <div class="border border-slate-200 rounded-lg px-3 py-2">
          <span class="font-medium">${escapeHtml(f.name)}</span>
          <span> ×${escapeHtml(f.servings)} (${escapeHtml(f.serving || '1 serving')})</span>
          <div>${nutritionValue(f.calories)} kcal · P ${nutritionValue(f.protein,'g')} · C ${nutritionValue(f.carbs,'g')} · F ${nutritionValue(f.fat,'g')}</div>
          <button data-nutrition-action="edit" data-id="${escapeHtml(f.id)}" class="btn-secondary text-xs">Edit food</button>
          <button data-nutrition-action="remove" data-id="${escapeHtml(f.id)}" class="btn-danger text-xs">Remove</button>
        </div>`).join('') : '<p>No foods added for this day yet.</p>';
      list.onclick=event=>{
        const button=event.target.closest('[data-nutrition-action]');
        if(!button || !list.contains(button))return;
        if(button.dataset.nutritionAction==='edit') editDayFood(button.dataset.id);
        if(button.dataset.nutritionAction==='remove') removeDayFood(button.dataset.id);
      };
      const t=sumDayFoods(dayFoods);
      for(const [id,key,unit] of [['cal','calories',''],['p','protein','g'],['c','carbs','g'],['f','fat','g'],...MICRO_FIELDS.map(f=>[f.key,f.key,f.unit])]) {
        const el=document.getElementById('tot-'+id); if(el) el.textContent=LoadnoteNutrition.number(t[key])===null?'Unknown':round1(t[key])+unit;
      }
      document.getElementById('tot-foods').textContent=dayFoods.length;
      renderNutritionTargets(t);
      const complete=data.nutrition.find(n=>n.date===(document.getElementById('nu-date').value || today()))?.complete===true;
      document.getElementById('nutrition-day-complete').checked=complete;
      document.getElementById('nutrition-completeness-status').textContent=complete?'Complete. Known nutrient totals contribute to averages.':'Partial / unconfirmed. Excluded from averages; mark complete when finished.';
    }

    function loadDayFoods() {
      const date = document.getElementById('nu-date').value || today();
      const entry = data.nutrition.find(n => n.date === date);
      dayFoods = entry && entry.foods ? JSON.parse(JSON.stringify(entry.foods)) : [];
      // Preserve older totals-only days as an editable entry instead of replacing them.
      if(entry && !Array.isArray(entry.foods)) dayFoods=[{...entry,id:'legacy-'+date,name:'Previously logged totals',serving:'1 daily entry',servings:1}];
      renderDayFoods();
    }

    let nutritionSaveSequence=0;
    function commitNutritionDay(completion=false) {
      const date=document.getElementById('nu-date').value || today();
      const existing=data.nutrition.find(n=>n.date===date);
      const entry={...(existing || {}),date,complete:completion===true,...sumDayFoods(dayFoods),foods:JSON.parse(JSON.stringify(dayFoods))};
      const idx=data.nutrition.findIndex(n=>n.date===date);
      if(idx>=0) data.nutrition[idx]=entry; else data.nutrition.push(entry);
      data.nutrition.sort((a,b)=>b.date.localeCompare(a.date));
      renderDayFoods(); renderNutritionHistory();
      const status=document.getElementById('nutrition-save-status');
      const sequence=++nutritionSaveSequence;
      if(status)status.textContent='Saving…';
      return persistNow(data).then(()=>{
        if(status && sequence===nutritionSaveSequence)status.textContent='Saved on this device';
      }).catch(error=>{
        if(status && sequence===nutritionSaveSequence)status.textContent='Not saved — export a backup before closing';
        reportStorageFailure(error);
      });
    }
    function saveDayFromFoods() { return commitNutritionDay(document.getElementById('nutrition-day-complete').checked); }
    function setNutritionDayComplete(value) { return commitNutritionDay(value); }

    function clearDayFoods() {
      if (dayFoods.length && !confirm('Clear all foods for this day?')) return;
      dayFoods = [];
      commitNutritionDay();
    }

    function readNutritionInput(id, defaultValue=null) {
      const raw=document.getElementById(id)?.value ?? '';
      if(raw.trim()==='')return defaultValue;
      const value=LoadnoteNutrition.number(raw);
      if(value===null || value>100000) throw new Error('Nutrition values must be finite numbers from 0 to 100,000.');
      return value;
    }
    function addQuickMacros() {
      try {
        const food={name:'Quick entry',serving:'1 entry',protein:readNutritionInput('nu-protein',0),carbs:readNutritionInput('nu-carbs',0),fat:readNutritionInput('nu-fat',0),calories:readNutritionInput('nu-calories'),fiber:readNutritionInput('nu-fiber')};
        if(food.calories===null && !food.protein && !food.carbs && !food.fat) throw new Error('Enter calories or at least one macro.');
        dayFoods.push(scaleFoodEntry(food,1));
        ['nu-protein','nu-carbs','nu-fat','nu-fiber','nu-calories'].forEach(id=>document.getElementById(id).value='');
        commitNutritionDay();
      } catch(error) { showToast(error.message,'error'); }
    }

    function saveCustomFood(addToDay) {
      try {
        const name=document.getElementById('cf-name').value.trim();
        if(!name)throw new Error('Name required');
        const food={id:crypto.randomUUID(),name,serving:document.getElementById('cf-serving').value.trim() || '1 serving',barcode:document.getElementById('cf-barcode').value.trim() || null,source:'custom'};
        const fields={protein:'p',carbs:'c',fat:'f',calories:'cal',fiber:'fiber',sugar:'sugar',sodium:'sodium',satFat:'satFat',cholesterol:'cholesterol',potassium:'potassium',calcium:'calcium',iron:'iron',vitaminC:'vitaminC',vitaminD:'vitaminD',magnesium:'magnesium'};
        Object.entries(fields).forEach(([key,id])=>food[key]=readNutritionInput('cf-'+id,['protein','carbs','fat'].includes(key)?0:null));
        if(food.calories===null)food.calories=food.protein*4+food.carbs*4+food.fat*9;
        ensureFoodLibrary();data.foodLibrary.push(food);saveData(data);renderFoodLibrary();
        if(addToDay) { dayFoods.push(scaleFoodEntry(food,1));commitNutritionDay(); }
        else showToast('Saved to library','success');
        ['name','serving','barcode',...Object.values(fields)].forEach(id=>{const el=document.getElementById('cf-'+id);if(el)el.value='';});
      } catch(error) { showToast(error.message,'error'); }
    }

    function renderFoodLibrary() {
      ensureFoodLibrary();
      const q = (document.getElementById('library-filter')?.value || '').toLowerCase().trim();
      let list = data.foodLibrary;
      if (q) list = list.filter(f => f.name.toLowerCase().includes(q) || (f.brand || '').toLowerCase().includes(q));
      const countEl = document.getElementById('library-count');
      if (countEl) countEl.textContent = data.foodLibrary.length + ' foods';
      const el = document.getElementById('food-library-list');
      if (!el) return;
      if (!list.length) {
        el.innerHTML = '<p class="text-slate-500">No foods match.</p>';
        _foodLibScroll = null;
        return;
      }
      mountFoodVirtual(el, list, false, 'lib');
    }

    function deleteLibraryFood(id) {
      data.foodLibrary = data.foodLibrary.filter(f => String(f.id) !== String(id));
      saveData(data);
      renderFoodLibrary();
    }

    function findLocalFoodByBarcode(barcode) {
      ensureFoodLibrary();
      const code = String(barcode || '').trim();
      if (!code) return null;
      return (data.foodLibrary || []).find(f => f.barcode && String(f.barcode) === code) || null;
    }

    function foodFromOpenFoodFactsProduct(p, barcode) { return LoadnoteNutrition.fromProduct(p, barcode); }

    function showBarcodeFoodResult(food, sourceLabel) {
      const resultEl = document.getElementById('barcode-result');
      if (!resultEl || !food) return;
      window._lastBarcodeFood = food;
      const safeName = escapeHtml(food.name || '');
      const safeBrand = escapeHtml(food.brand || '');
      resultEl.innerHTML = `
        <div class="border border-slate-200 rounded-lg p-3">
          <p class="text-xs text-emerald-600 mb-1">${sourceLabel}</p>
          <p class="font-medium">${safeName}</p>
          <p class="text-xs text-slate-500">${safeBrand}${safeBrand && food.serving ? ' · ' : ''}${escapeHtml(food.serving || '')}</p>
          <p class="text-sm mt-1">${nutritionValue(food.calories)} kcal · P${nutritionValue(food.protein)} C${nutritionValue(food.carbs)} F${nutritionValue(food.fat)}</p>
          <div class="flex flex-wrap gap-2 mt-2">
            <button class="btn-primary text-sm" onclick="pickFood(window._lastBarcodeFood)">Add to Day</button>
            <button class="btn-secondary text-sm" onclick="saveBarcodeToLibrary(window._lastBarcodeFood)">Save to Library</button>
            ${findLocalFoodByBarcode(food.barcode) ? `<button data-id="${escapeHtml(findLocalFoodByBarcode(food.barcode).id)}" class="btn-secondary" onclick="refreshBarcodeFood(this.dataset.id)">Refresh / compare label</button>` : ''}
          </div>
        </div>
      `;
    }

    async function fetchOpenFoodFacts(barcode) {
      // Try API v2 first, then v0
      const urls = [
        'https://world.openfoodfacts.org/api/v2/product/' + encodeURIComponent(barcode) + '?fields=product_name,generic_name,brands,serving_size,nutriments,code',
        'https://world.openfoodfacts.org/api/v0/product/' + encodeURIComponent(barcode) + '.json'
      ];
      let lastErr = null;
      for (const url of urls) {
        try {
          const res = await fetch(url, { headers: { Accept: 'application/json' } });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const json = await res.json();
          // v2 uses status === 'success' or product present; v0 uses status === 1
          const product = json.product;
          const ok = product && (json.status === 1 || json.status === 'success' || json.status_verbose === 'product found' || !!product.product_name || !!product.nutriments);
          if (ok && product) return product;
          if (json.status === 0 || json.status === 'failure') return null;
        } catch (e) {
          lastErr = e;
        }
      }
      if (lastErr) throw lastErr;
      return null;
    }

    async function lookupBarcode(code) {
      const barcode = String(code || document.getElementById('barcode-input')?.value || '').trim();
      if (!barcode) return showToast('Enter a barcode', 'error');
      const resultEl = document.getElementById('barcode-result');
      if (resultEl) resultEl.innerHTML = '<p class="text-slate-500">Checking local library…</p>';

      // 1) Local library database (offline)
      const local = findLocalFoodByBarcode(barcode);
      if (local) {
        showBarcodeFoodResult(local, 'Found in your local food library');
        showToast('Matched local library', 'success');
        return;
      }

      if (resultEl) resultEl.innerHTML = '<p class="text-slate-500">Looking up Open Food Facts database…</p>';
      try {
        const product = await fetchOpenFoodFacts(barcode);
        if (!product) {
          if (resultEl) {
            resultEl.innerHTML = `
              <p class="text-red-500">Product not found online.</p>
              <p class="text-xs text-slate-500 mt-1">Try another barcode, add the food under <b>Add Custom Food</b>, or search the library.</p>
            `;
          }
          return;
        }
        const food = foodFromOpenFoodFactsProduct(product, barcode);
        showBarcodeFoodResult(food, 'From Open Food Facts (online database)');
      } catch (e) {
        if (resultEl) {
          resultEl.innerHTML = `
            <p class="text-red-500">Online lookup failed.</p>
            <p class="text-xs text-slate-500 mt-1">Check your internet connection. You can still add foods manually or from the library.</p>
          `;
        }
        console.warn(e);
      }
    }

    function saveBarcodeToLibrary(food) {
      if (!food) return;
      ensureFoodLibrary();
      const existing = data.foodLibrary.findIndex(f => f.barcode && String(f.barcode) === String(food.barcode));
      if (existing >= 0) {
        data.foodLibrary[existing] = { ...data.foodLibrary[existing], ...food };
      } else {
        data.foodLibrary.push({ ...food });
      }
      saveData(data);
      renderFoodLibrary();
      showToast('Saved to local food library', 'success');
    }

    function toggleBarcodeScanner() {
      if (scannerRunning) stopBarcodeScanner();
      else startBarcodeScanner();
    }

    function loadHtml5Qrcode() {
      return new Promise((resolve, reject) => {
        if (typeof Html5Qrcode !== 'undefined') return resolve();
        const existing = document.querySelector('script[data-html5-qrcode]');
        if (existing) {
          existing.addEventListener('load', () => resolve());
          existing.addEventListener('error', reject);
          return;
        }
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
        s.async = true;
        s.dataset.html5Qrcode = '1';
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Failed to load scanner library'));
        document.head.appendChild(s);
      });
    }

    async function startBarcodeScanner() {
      const btn = document.getElementById('scan-btn');
      try {
        if (btn) btn.textContent = 'Loading scanner…';
        await loadHtml5Qrcode();
      } catch (e) {
        if (btn) btn.textContent = 'Start Camera Scan';
        alert('Barcode scanner library not available. Use manual barcode entry.');
        return;
      }
      html5QrCode = new Html5Qrcode('barcode-reader');
      html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decoded) => {
          document.getElementById('barcode-input').value = decoded;
          stopBarcodeScanner();
          lookupBarcode(decoded);
        },
        () => {}
      ).then(() => {
        scannerRunning = true;
        if (btn) btn.textContent = 'Stop Camera';
      }).catch(err => {
        if (btn) btn.textContent = 'Start Camera Scan';
        alert('Camera error: ' + err);
      });
    }

    function stopBarcodeScanner() {
      if (html5QrCode && scannerRunning) {
        html5QrCode.stop().then(() => {
          html5QrCode.clear();
          scannerRunning = false;
          document.getElementById('scan-btn').textContent = 'Start Camera Scan';
        }).catch(() => { scannerRunning = false; });
      }
    }

    function deleteNutrition(date) {
      if (!confirm('Delete this entry?')) return;
      data.nutrition = data.nutrition.filter(n => n.date !== date);
      saveData(data);
      renderNutritionHistory();
      if (document.getElementById('nu-date').value === date) {
        dayFoods = [];
        renderDayFoods();
      }
    }

    function renderNutritionHistory() {
      const tbody = document.getElementById('nutrition-history');
      if (!data.nutrition.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="py-4 text-slate-500">No nutrition data yet.</td></tr>';
        return;
      }
      tbody.innerHTML = data.nutrition.map(n => `
        <tr class="border-b border-slate-100">
          <td class="py-2">${formatDate(n.date)}</td>
          <td class="py-2">${nutritionValue(n.calories)}</td>
          <td class="py-2">${nutritionValue(n.protein,'g')}</td>
          <td class="py-2">${nutritionValue(n.carbs,'g')}</td>
          <td class="py-2">${nutritionValue(n.fat,'g')}</td>
          <td class="py-2">${nutritionValue(n.fiber,'g')}</td>
          <td class="py-2">${nutritionValue(n.sodium,'mg')}</td>
          <td class="py-2"><button data-date="${escapeHtml(n.date)}" onclick="openNutritionDate(this.dataset.date)" class="btn-secondary">Edit</button> <button data-date="${escapeHtml(n.date)}" onclick="deleteNutrition(this.dataset.date)" class="btn-danger">Delete</button></td>
        </tr>
      `).join('');
    }
    function openNutritionDate(date) {
      document.getElementById('nu-date').value=date;
      showSubTab('nutrition','nu-today');
    }
    function repeatRecentFood() { openRecentNutritionFoods(); }
    function saveNutritionTargets() {
      try {
        data.nutritionTargets={calories:readNutritionInput('nutrition-target-calories'),protein:readNutritionInput('nutrition-target-protein')};
        persistNow(data).then(()=>showToast('Targets saved','success')).catch(reportStorageFailure);
        renderNutritionTargets(sumDayFoods(dayFoods));
      } catch(error) {showToast(error.message,'error');}
    }
    function renderNutritionTargets(totals) {
      const targets=data.nutritionTargets || {};
      const summary=document.getElementById('nutrition-target-summary');
      if(summary)summary.textContent=['calories','protein'].map(key=>{
        const target=LoadnoteNutrition.number(targets[key]);
        if(!target)return key+': no target';
        const total=LoadnoteNutrition.number(totals[key]);
        return key+': '+(total===null?'incomplete data':round1(total)+' / '+target+(key==='protein'?'g':' kcal'));
      }).join(' · ');
      for(const key of ['calories','protein']) {
        const input=document.getElementById('nutrition-target-'+key);
        if(input && document.activeElement!==input) input.value=targets[key] ?? '';
      }
    }
