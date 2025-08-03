export const renderProductImage = (countOfSides, { a = 'A', b = 'B', c = 'C' }) => {
    const size = 60; // Размер SVG
    const strokeWidth = 3;
    const color = '#3498db'; // Синий цвет
    const textColor = '#2c3e50'; // Цвет текста для букв
    const fontSize = '10px'; // Размер шрифта для букв
    const textOffset = 10; // Увеличенный отступ для текста

    switch (countOfSides) {
        case 1: // Квадрат (A: ширина)
            return (
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <rect x={strokeWidth / 2} y={strokeWidth / 2} width={size - strokeWidth} height={size - strokeWidth}
                        fill="none" stroke={color} strokeWidth={strokeWidth} rx="5" ry="5" />
                    {/* Буква A (ширина) */}
                    <text x={size / 2} y={size - textOffset - 4} textAnchor="middle" dominantBaseline="hanging" fill={textColor} fontSize={fontSize}>{a}</text>
                </svg>
            );
        case 2: // Две перпендикулярные линии, соединяющиеся в углу (угол справа сверху)
            const cornerX2 = size * 0.8;
            const cornerY2 = size * 0.2;
            return (
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {/* Горизонтальная линия (сторона A - ширина) */}
                    <line x1={size * 0.2} y1={cornerY2} x2={cornerX2} y2={cornerY2}
                        stroke={color} strokeWidth={strokeWidth} />
                    {/* Вертикальная линия (сторона B - высота) */}
                    <line x1={cornerX2} y1={cornerY2} x2={cornerX2} y2={size * 0.8}
                        stroke={color} strokeWidth={strokeWidth} />
                    {/* Буква A (ширина) */}
                    <text x={size * 0.5} y={cornerY2 - textOffset + 6} textAnchor="middle" dominantBaseline="auto" fill={textColor} fontSize={fontSize}>{a}</text>
                    {/* Буква B (высота) */}
                    <text transform={`translate(84, -${textOffset * b.length / 3}) rotate(90)`}  x={cornerX2 - textOffset - 6} y={size * 0.5} textAnchor="start" dominantBaseline="middle" fill={textColor} fontSize={fontSize}>{b}</text>
                </svg>
            );
        case 3: // Три линии, начинающиеся из одной точки (как оси координат) с буквами
            const originX3 = size * 0.8; // Угол справа сверху
            const originY3 = size * 0.2;
            return (
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {/* Ось A (ширина) - горизонтальная, влево от угла */}
                    <line x1={originX3} y1={originY3} x2={size * 0.2} y2={originY3}
                        stroke={color} strokeWidth={strokeWidth} />
                    <text x={size * 0.2 + textOffset} y={originY3 + textOffset + 2} textAnchor="end" dominantBaseline="auto" fill={textColor} fontSize={fontSize}>{a}</text>

                    {/* Ось B (высота) - вертикальная, вниз от угла */}
                    <line x1={originX3} y1={originY3} x2={originX3} y2={size * 0.8}
                        stroke={color} strokeWidth={strokeWidth} />
                    <text transform={`translate(84, -${textOffset * b.length / 3}) rotate(90)`} x={originX3 - textOffset - 6} y={size * 0.5} textAnchor="start" dominantBaseline="middle" fill={textColor} fontSize={fontSize}>{b}</text>
                    {/* Ось C (глубина) - диагональная, вниз-влево от угла */}
                    <line x1={originX3} y1={originY3} x2={size * 0.2} y2={size * 0.8}
                        stroke={color} strokeWidth={strokeWidth} />
                    <text x={size * 0.2 + textOffset} y={size * 0.8 + textOffset} textAnchor="end" dominantBaseline="auto" fill={textColor} fontSize={fontSize}>{c}</text>
                </svg>
            );
        default:
            return <div style={{ width: size, height: size, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8em', color: '#666' }}>Нет изобр.</div>;
    }
};