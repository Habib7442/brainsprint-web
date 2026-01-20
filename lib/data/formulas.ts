
export interface FormulaQuestion {
    id: string;
    topic: string;
    chapter: string;
    formulaHead: string;       // e.g. "Area of Sector ="
    template: string;         // e.g. "(θ/360) × [?]"
    correctPart: string;      // e.g. "πr²"
    options: string[];        // 4 options e.g. ["πr", "πr²", "2πr", "r²"]
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

export const FORMULA_DATA: FormulaQuestion[] = [
    // MENSURATION
    {
        id: 'mens_001',
        topic: 'Quant Maths',
        chapter: 'Mensuration',
        formulaHead: 'Area of Circle =',
        template: 'π × [?]',
        correctPart: 'r²',
        options: ['r', 'r²', '2r', 'd'],
        difficulty: 'Easy'
    },
    {
        id: 'mens_002',
        topic: 'Quant Maths',
        chapter: 'Mensuration',
        formulaHead: 'Volume of Sphere =',
        template: '(4/3) × π × [?]',
        correctPart: 'r³',
        options: ['r²', 'r³', '3r', '2r²'],
        difficulty: 'Medium'
    },
    {
        id: 'mens_003',
        topic: 'Quant Maths',
        chapter: 'Mensuration',
        formulaHead: 'Area of Sector =',
        template: '(θ/360) × [?]',
        correctPart: 'πr²',
        options: ['πr²', '2πr', 'πr', 'r²'],
        difficulty: 'Medium'
    },
    {
        id: 'mens_004',
        topic: 'Quant Maths',
        chapter: 'Mensuration',
        formulaHead: 'Curved Surface Area of Cone =',
        template: 'π × r × [?]',
        correctPart: 'l',
        options: ['h', 'l', 'r', 's'],
        difficulty: 'Medium'
    },
    {
        id: 'mens_005',
        topic: 'Quant Maths',
        chapter: 'Mensuration',
        formulaHead: 'Total Surface Area of Cylinder =',
        template: '2πr × ([?])',
        correctPart: 'r + h',
        options: ['r + h', 'r² + h', 'r - h', '2r + h'],
        difficulty: 'Hard'
    },

    // TRIGONOMETRY
    {
        id: 'trig_001',
        topic: 'Quant Maths',
        chapter: 'Trigonometry',
        formulaHead: 'Identity:',
        template: 'sin²θ + [?] = 1',
        correctPart: 'cos²θ',
        options: ['cos²θ', 'tan²θ', 'sec²θ', 'sin²θ'],
        difficulty: 'Easy'
    },
    {
        id: 'trig_002',
        topic: 'Quant Maths',
        chapter: 'Trigonometry',
        formulaHead: 'Identity:',
        template: '1 + tan²θ = [?]',
        correctPart: 'sec²θ',
        options: ['cosec²θ', 'sec²θ', 'cos²θ', 'cot²θ'],
        difficulty: 'Medium'
    },
    {
        id: 'trig_003',
        topic: 'Quant Maths',
        chapter: 'Trigonometry',
        formulaHead: 'Identity:',
        template: 'cos(A + B) =',
        correctPart: 'cosA cosB - sinA sinB',
        options: ['cosA cosB - sinA sinB', 'cosA cosB + sinA sinB', 'sinA cosB + cosA sinB', 'sinA sinB - cosA cosB'],
        difficulty: 'Hard'
    },

    // ALGEBRA
    {
        id: 'alg_001',
        topic: 'Quant Maths',
        chapter: 'Algebra',
        formulaHead: 'Identity:',
        template: '(a + b)³ =',
        correctPart: 'a³ + b³ + 3ab(a+b)',
        options: ['a³ + b³ + 3ab(a+b)', 'a³ + b³ + 3a²b²', 'a³ + b³ + ab(a+b)', 'a² + b² + 2ab'],
        difficulty: 'Medium'
    },
    {
        id: 'alg_002',
        topic: 'Quant Maths',
        chapter: 'Algebra',
        formulaHead: 'Identity:',
        template: 'a³ - b³ =',
        correctPart: '(a - b)(a² + ab + b²)',
        options: ['(a - b)(a² + ab + b²)', '(a - b)(a² - ab + b²)', '(a + b)(a² - ab + b²)', '(a - b)(a + b)'],
        difficulty: 'Hard'
    }
];
