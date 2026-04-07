// Base de datos de alimentos comunes en España
// kcal / protein / carbs / fat por 100g
// unit + per: unidad alternativa (ej. "ud" = 60g)

export const FOOD_DB = [
  // Proteínas
  { name: 'Pechuga de pollo', kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: 'Atún al natural (lata)', kcal: 116, protein: 26, carbs: 0, fat: 1 },
  { name: 'Salmón', kcal: 208, protein: 20, carbs: 0, fat: 13 },
  { name: 'Huevo entero', kcal: 155, protein: 13, carbs: 1.1, fat: 11, unit: 'ud', per: 60 },
  { name: 'Clara de huevo', kcal: 52, protein: 11, carbs: 0.7, fat: 0.2 },
  { name: 'Ternera magra', kcal: 158, protein: 26, carbs: 0, fat: 5.4 },
  { name: 'Jamón york', kcal: 107, protein: 17, carbs: 2, fat: 3.5 },
  { name: 'Pavo en fiambre', kcal: 109, protein: 20, carbs: 1, fat: 3 },
  { name: 'Merluza', kcal: 82, protein: 17, carbs: 0, fat: 1 },
  { name: 'Sardinas', kcal: 208, protein: 25, carbs: 0, fat: 12 },
  { name: 'Gambas', kcal: 85, protein: 18, carbs: 1, fat: 1 },
  { name: 'Tofu', kcal: 76, protein: 8, carbs: 2, fat: 4 },
  // Lácteos
  { name: 'Leche entera', kcal: 61, protein: 3.2, carbs: 4.7, fat: 3.3 },
  { name: 'Leche desnatada', kcal: 35, protein: 3.4, carbs: 4.9, fat: 0.2 },
  { name: 'Yogur natural', kcal: 59, protein: 3.8, carbs: 4.7, fat: 3.3, unit: 'ud', per: 125 },
  { name: 'Yogur griego', kcal: 97, protein: 9, carbs: 4, fat: 5 },
  { name: 'Queso fresco 0%', kcal: 49, protein: 9, carbs: 2.7, fat: 0.2 },
  { name: 'Requesón', kcal: 74, protein: 11, carbs: 3.6, fat: 1.5 },
  { name: 'Queso manchego', kcal: 390, protein: 27, carbs: 0.5, fat: 32 },
  // Carbohidratos
  { name: 'Arroz blanco (cocido)', kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: 'Pasta cocida', kcal: 131, protein: 5, carbs: 25, fat: 1.1 },
  { name: 'Pan de molde integral', kcal: 247, protein: 9, carbs: 41, fat: 4, unit: 'rebanada', per: 30 },
  { name: 'Pan baguette', kcal: 270, protein: 9, carbs: 53, fat: 1.6 },
  { name: 'Avena en copos', kcal: 389, protein: 17, carbs: 66, fat: 7 },
  { name: 'Patata cocida', kcal: 87, protein: 1.9, carbs: 20, fat: 0.1 },
  { name: 'Boniato', kcal: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  { name: 'Quinoa cocida', kcal: 120, protein: 4.4, carbs: 22, fat: 1.9 },
  // Verduras
  { name: 'Brócoli', kcal: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  { name: 'Espinacas', kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  { name: 'Tomate', kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  { name: 'Lechuga', kcal: 15, protein: 1.4, carbs: 2.9, fat: 0.2 },
  { name: 'Pimiento rojo', kcal: 31, protein: 1, carbs: 6, fat: 0.3 },
  { name: 'Zanahoria', kcal: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  { name: 'Pepino', kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
  { name: 'Cebolla', kcal: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  { name: 'Champiñones', kcal: 22, protein: 3.1, carbs: 3.3, fat: 0.3 },
  // Frutas
  { name: 'Plátano', kcal: 89, protein: 1.1, carbs: 23, fat: 0.3, unit: 'ud', per: 120 },
  { name: 'Manzana', kcal: 52, protein: 0.3, carbs: 14, fat: 0.2, unit: 'ud', per: 150 },
  { name: 'Naranja', kcal: 47, protein: 0.9, carbs: 12, fat: 0.1, unit: 'ud', per: 130 },
  { name: 'Fresas', kcal: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
  { name: 'Arándanos', kcal: 57, protein: 0.7, carbs: 14, fat: 0.3 },
  { name: 'Kiwi', kcal: 61, protein: 1.1, carbs: 15, fat: 0.5, unit: 'ud', per: 75 },
  // Grasas saludables
  { name: 'Aceite de oliva', kcal: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Aguacate', kcal: 160, protein: 2, carbs: 9, fat: 15, unit: 'ud', per: 150 },
  { name: 'Almendras', kcal: 579, protein: 21, carbs: 22, fat: 50 },
  { name: 'Nueces', kcal: 654, protein: 15, carbs: 14, fat: 65 },
  { name: 'Mantequilla de cacahuete', kcal: 588, protein: 25, carbs: 20, fat: 50 },
  // Otros comunes
  { name: 'Lentejas cocidas', kcal: 116, protein: 9, carbs: 20, fat: 0.4 },
  { name: 'Garbanzos cocidos', kcal: 164, protein: 9, carbs: 27, fat: 2.6 },
  { name: 'Proteína en polvo (whey)', kcal: 370, protein: 75, carbs: 6, fat: 6, unit: 'scoop', per: 30 },
  { name: 'Chocolate negro 70%', kcal: 600, protein: 8, carbs: 46, fat: 44 },
  { name: 'Miel', kcal: 304, protein: 0.3, carbs: 82, fat: 0 },
]
