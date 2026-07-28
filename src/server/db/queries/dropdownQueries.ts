import pool from '../config'

export interface DropdownOption {
  id: number
  label: string
  slug: string
}

export async function getGenderOptions(locale: string = 'en'): Promise<DropdownOption[]> {
  const result = await pool.query(
    `SELECT go.id, gt.label, go.slug
     FROM gender_options go
     LEFT JOIN gender_translations gt ON go.id = gt.gender_id AND gt.locale = $1
     ORDER BY go.id ASC`,
    [locale]
  )
  return result.rows
}

export async function getReligionOptions(locale: string = 'en'): Promise<DropdownOption[]> {
  const result = await pool.query(
    `SELECT ro.id, rt.label, ro.slug
     FROM religion_options ro
     LEFT JOIN religion_translations rt ON ro.id = rt.religion_id AND rt.locale = $1
     ORDER BY ro.id ASC`,
    [locale]
  )
  return result.rows
}

export async function getMaritalStatusOptions(locale: string = 'en'): Promise<DropdownOption[]> {
  const result = await pool.query(
    `SELECT mso.id, mst.label, mso.slug
     FROM marital_status_options mso
     LEFT JOIN marital_status_translations mst ON mso.id = mst.marital_status_id AND mst.locale = $1
     ORDER BY mso.id ASC`,
    [locale]
  )
  return result.rows
}

export async function getJobCategoryOptions(locale: string = 'en'): Promise<DropdownOption[]> {
  const result = await pool.query(
    `SELECT jco.id, jct.label, jco.slug
     FROM job_category_options jco
     LEFT JOIN job_category_translations jct ON jco.id = jct.job_category_id AND jct.locale = $1
     ORDER BY jco.id ASC`,
    [locale]
  )
  return result.rows
}

export async function getEducationLevelOptions(locale: string = 'en'): Promise<DropdownOption[]> {
  const result = await pool.query(
    `SELECT elo.id, elt.label, elo.slug
     FROM education_level_options elo
     LEFT JOIN education_level_translations elt ON elo.id = elt.education_level_id AND elt.locale = $1
     ORDER BY elo.id ASC`,
    [locale]
  )
  return result.rows
}

export async function getMedicalStatusOptions(locale: string = 'en'): Promise<DropdownOption[]> {
  const result = await pool.query(
    `SELECT mso.id, mst.label, mso.slug
     FROM medical_status_options mso
     LEFT JOIN medical_status_translations mst ON mso.id = mst.medical_status_id AND mst.locale = $1
     ORDER BY mso.id ASC`,
    [locale]
  )
  return result.rows
}

export async function getAllDropdownOptions(locale: string = 'en'): Promise<{
  genders: DropdownOption[]
  religions: DropdownOption[]
  maritalStatuses: DropdownOption[]
  jobCategories: DropdownOption[]
  educationLevels: DropdownOption[]
  medicalStatuses: DropdownOption[]
}> {
  const [genders, religions, maritalStatuses, jobCategories, educationLevels, medicalStatuses] = await Promise.all([
    getGenderOptions(locale),
    getReligionOptions(locale),
    getMaritalStatusOptions(locale),
    getJobCategoryOptions(locale),
    getEducationLevelOptions(locale),
    getMedicalStatusOptions(locale),
  ])

  return {
    genders,
    religions,
    maritalStatuses,
    jobCategories,
    educationLevels,
    medicalStatuses,
  }
}
