/**
 * Utilidades para el cálculo y formateo de fechas relacionadas con mascotas
 */

/**
 * Calcula la fecha de cumpleaños (birthday) basándose en la edad y unidad proporcionadas
 * @param ageValue - Valor numérico de la edad
 * @param ageUnit - Unidad de tiempo ('years' o 'months')
 * @returns Fecha de cumpleaños en formato YYYY-MM-DD o null si la edad no es válida
 */
export function calculateBirthday(
    ageValue: string | number,
    ageUnit: 'years' | 'months'
): string | null {
    const age = typeof ageValue === 'string' ? parseFloat(ageValue) : ageValue;
    if (!age || isNaN(age) || age <= 0) {
        return null;
    }

    const today = new Date();
    const birthday = new Date(today);

    if (ageUnit === 'years') {
        birthday.setFullYear(today.getFullYear() - age);
    } else {
        // meses
        birthday.setMonth(today.getMonth() - age);
    }

    // Formatear como YYYY-MM-DD
    const year = birthday.getFullYear();
    const month = String(birthday.getMonth() + 1).padStart(2, '0');
    const day = String(birthday.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Calcula la edad desde una fecha de cumpleaños
 * @param birthday - Fecha de cumpleaños en formato YYYY-MM-DD
 * @returns Objeto con el valor de la edad y la unidad (years o months), o null si la fecha no es válida
 */
export function calculateAgeFromBirthday(
    birthday: string
): { value: number; unit: 'years' | 'months' } | null {
    if (!birthday) return null;

    try {
        const birthDate = new Date(birthday);
        const today = new Date();

        if (isNaN(birthDate.getTime())) return null;

        const yearsDiff = today.getFullYear() - birthDate.getFullYear();
        const monthsDiff =
            (today.getFullYear() - birthDate.getFullYear()) * 12 +
            (today.getMonth() - birthDate.getMonth());

        // Si tiene más de 1 año, mostrar en años, sino en meses
        if (yearsDiff >= 1) {
            return { value: yearsDiff, unit: 'years' };
        } else {
            return { value: monthsDiff > 0 ? monthsDiff : 1, unit: 'months' };
        }
    } catch (err) {
        console.error('Error calculando edad desde birthday:', err);
        return null;
    }
}

/**
 * Formatea la edad desde una fecha de cumpleaños para mostrar en la UI
 * @param birthday - Fecha de cumpleaños en formato YYYY-MM-DD
 * @returns String formateado con la edad (ej: "2 años" o "3 meses"), o null si la fecha no es válida
 */
export function formatAgeFromBirthday(birthday?: string): string | null {
    if (!birthday) return null;

    try {
        const birthDate = new Date(birthday);
        const today = new Date();

        if (isNaN(birthDate.getTime())) return null;

        const yearsDiff = today.getFullYear() - birthDate.getFullYear();
        const monthsDiff =
            (today.getFullYear() - birthDate.getFullYear()) * 12 +
            (today.getMonth() - birthDate.getMonth());

        // Si tiene más de 1 año, mostrar en años, sino en meses
        if (yearsDiff >= 1) {
            return `${yearsDiff} ${yearsDiff === 1 ? 'año' : 'años'}`;
        } else {
            return `${monthsDiff > 0 ? monthsDiff : 1} ${monthsDiff === 1 ? 'mes' : 'meses'}`;
        }
    } catch (err) {
        console.error('Error calculando edad desde birthday:', err);
        return null;
    }
}

