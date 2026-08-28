import type {
  ActivityType,
  DocumentTypeId,
  EmployeeDocumentStatus,
  UploadStage,
} from "./types";

export const documentTypeLabels: Record<DocumentTypeId, string> = {
  height_work: "אישור עבודה בגובה",
  operator: "תעודת מפעיל",
  execution: "הסמכת ביצוע",
  professional: "רישיון מקצועי",
  safety: "הדרכת בטיחות",
  equipment: "אישור ציוד",
  medical: "אישור רפואי",
};

export const statusLabels: Record<EmployeeDocumentStatus, string> = {
  current: "המסמכים בתוקף",
  expiring: "לקראת פקיעת תוקף",
  expired: "מסמך פג תוקף",
  needs_review: "נדרשת בדיקה",
  no_documents: "טרם הועלו מסמכים",
};

export const statusBadgeLabels: Record<EmployeeDocumentStatus, string> = {
  current: "בתוקף",
  expiring: "לקראת פקיעה",
  expired: "פג תוקף",
  needs_review: "בדיקה",
  no_documents: "ללא מסמכים",
};

export const statusStripLabels: Record<EmployeeDocumentStatus, string> = {
  current: "מסמכים בתוקף",
  expiring: "לקראת פקיעה",
  expired: "פג תוקף",
  needs_review: "נדרשת בדיקה",
  no_documents: "ללא מסמכים",
};

export const uploadStageLabels: Record<UploadStage, string> = {
  reading: "קוראים את המסמך",
  identifying: "מזהים את סוג המסמך",
  extracting: "מחלצים פרטים",
  matching: "מחפשים עובד מתאים",
  completed: "הושלם",
  failed: "לא הצליח",
};

export const activityTypeLabels: Record<ActivityType, string> = {
  action: "נדרשת פעולה",
  alert: "התראה",
  update: "עדכון",
  processing: "סייקל פעיל",
};

export const copy = {
  appTitle: "פעילות",
  appName: "סרטיפי",
  settingsTitle: "הגדרות",
  employeesTitle: "עובדים",
  upload: "העלאה",
  uploadDocument: "העלאה",
  processingOne: "מעבדים מסמך…",
  processingMany: (n: number) => `מעבדים ${n} מסמכים…`,
  jobsTitle: "עיבוד מסמכים",
  jobsEmpty: "אין מסמכים בעיבוד",
  captured: "המסמך נקלט",
  gallery: "גלריה",
  camera: "צילום",
  pdf: "קובץ PDF",
  dropHint: "גררו קובץ לכאן או בחרו מהמחשב",
  pickFile: "בחירת קובץ",
  invalidFile: "אפשר להעלות תמונה או PDF בלבד",
  composerTitle: "מסמך חדש",
  allClearTitle: "אין מסמכים שדורשים טיפול",
  allClearBody: "אין מסמכים שפג תוקפם או שדורשים בדיקה כרגע.",
  feedTitle: "פעילות אחרונה",
  employeesPlaceholderTitle: "רשימת העובדים",
  employeesPlaceholderBody:
    "חיפוש, יצירה ופרטי עובד יגיעו בשלב הבא. בינתיים אפשר לראות את מצב המסמכים במסך פעילות.",
  employeeCardTitle: "עובד",
  openEmployeePage: "כניסה לעמוד העובד",
  identityNumberLabel: "מספר מזהה",
  phoneLabel: "מספר טלפון",
  phoneMissing: "לא צוין",
  employeeNotFound: "העובד לא נמצא",
  postActionsTitle: "פעולות",
  viewEmployee: "צפייה בעובד",
  uploadNew: "העלה אישור חדש",
  openProcessing: "פתח עיבוד",
  processingSupport: "קוראים ומחלצים את פרטי המסמכים",
  assignedToast: (title: string, name: string) => `שייכנו ${title} ל${name}`,
  replacedToast: (name: string) => `אישור חדש החליף את האישור הקודם של ${name}`,
  replacedFeedTitle: "אישור חדש החליף את האישור הקודם",
  assignedFeedTitle: (title: string) => `שייכנו ${title}`,
};
