// Xodim turlarini aniqlash va ruxsatlar tizimi

export interface StaffRole {
  isAcademicDeputy: boolean      // O'quv ishlari bo'yicha direktor o'rinbosari
  isMoralDeputy: boolean         // Ma'naviy-ma'rifiy ishlar bo'yicha direktor o'rinbosari
  isHRManager: boolean           // Kadrlar menejeri
  isDirector: boolean            // Direktor
  isPedagogue: boolean           // Pedagog/O'qituvchi
  isClassTeacher: boolean        // Sinf rahbari
  isTechnical: boolean           // Texnik xodim
}

export interface StaffPermissions {
  canViewAllStaff: boolean
  canManageStaff: boolean
  canViewAllStudents: boolean
  canAdmitStudent: boolean
  canExpelStudent: boolean
  canManageClassStudents: boolean
  canViewAllAttendance: boolean
  canViewAllGrades: boolean
  canAssignSubjects: boolean
  canManageWorkload: boolean
  canAssignClassTeacher: boolean
  canViewMonitoring: boolean
  canManageTasks: boolean
  canViewAIAnalysis: boolean
}

// Xodim rollarini aniqlash
export function getStaffRole(position: string, staffType: string, classId?: string | null): StaffRole {
  const posLower = position.toLowerCase()
  
  return {
    isAcademicDeputy: staffType === "management" && 
      (posLower.includes("o'quv") || posLower.includes("oquv")),
    
    isMoralDeputy: staffType === "management" && 
      (posLower.includes("ma'naviy") || posLower.includes("manaviy") || posLower.includes("tarbiya")),
    
    isHRManager: posLower.includes("kadr") || posLower.includes("hr") || 
      posLower.includes("inson resurslari"),
    
    isDirector: (posLower.includes("direktor") || posLower.includes("director")) && 
      !posLower.includes("o'rinbosar") && !posLower.includes("orinbosar"),
    
    isPedagogue: staffType === "pedagogue",
    
    isClassTeacher: staffType === "pedagogue" && !!classId, // Sinfga biriktirilgan pedagog
    
    isTechnical: staffType === "technical"
  }
}

// Xodim ruxsatlarini aniqlash
export function getStaffPermissions(role: StaffRole): StaffPermissions {
  return {
    // Barcha xodimlarni ko'rish
    canViewAllStaff: role.isDirector || role.isHRManager,
    
    // Xodimlarni boshqarish (qo'shish, tahrirlash, o'chirish)
    canManageStaff: role.isDirector || role.isHRManager,
    
    // Barcha o'quvchilarni ko'rish
    canViewAllStudents: role.isDirector || role.isAcademicDeputy || role.isMoralDeputy,
    
    // O'quvchi qabul qilish
    canAdmitStudent: role.isDirector || role.isHRManager,
    
    // O'quvchini chetlatish
    canExpelStudent: role.isDirector || role.isHRManager,
    
    // Sinf o'quvchilarini boshqarish (faqat sinf rahbari)
    canManageClassStudents: role.isClassTeacher || role.isDirector,
    
    // Barcha davomat ma'lumotlarini ko'rish
    canViewAllAttendance: role.isDirector || role.isMoralDeputy,
    
    // Barcha baholarni ko'rish
    canViewAllGrades: role.isDirector || role.isAcademicDeputy,
    
    // O'qituvchilarga fan biriktirish
    canAssignSubjects: role.isDirector || role.isAcademicDeputy,
    
    // O'quv yuklamalarini boshqarish
    canManageWorkload: role.isDirector || role.isAcademicDeputy,
    
    // Sinf rahbari biriktirish
    canAssignClassTeacher: role.isDirector || role.isMoralDeputy,
    
    // Monitoring natijalarini ko'rish
    canViewMonitoring: role.isDirector || role.isAcademicDeputy,
    
    // Topshiriqlarni boshqarish
    canManageTasks: role.isDirector || role.isHRManager,
    
    // AI tahlilini ko'rish
    canViewAIAnalysis: role.isDirector || role.isMoralDeputy
  }
}

// Funksiyaga ruxsat bormi tekshirish
export function canPerformAction(
  currentUserId: string,
  targetStaffId: string,
  currentUserRole: StaffRole
): boolean {
  // O'z profilida bo'lsa - ruxsat bor
  if (currentUserId === targetStaffId) return true
  
  // Direktor hamma narsani ko'ra oladi
  if (currentUserRole.isDirector) return true
  
  return false
}

// Xodim turi nomini olish
export function getStaffRoleLabel(role: StaffRole): string {
  if (role.isDirector) return "Direktor"
  if (role.isAcademicDeputy) return "O'quv ishlari bo'yicha direktor o'rinbosari"
  if (role.isMoralDeputy) return "Ma'naviy-ma'rifiy ishlar bo'yicha direktor o'rinbosari"
  if (role.isHRManager) return "Kadrlar menejeri"
  if (role.isClassTeacher) return "Sinf rahbari"
  if (role.isPedagogue) return "Pedagog"
  if (role.isTechnical) return "Texnik xodim"
  return "Xodim"
}
