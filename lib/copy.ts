import type {
  ActivityItem,
  ActivityType,
  DocumentLifecycle,
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

export const lifecycleLabels: Record<DocumentLifecycle, string> = {
  processing: "בעיבוד",
  needs_review: "נדרשת בדיקה",
  active: "פעיל",
  superseded: "הוחלף",
  archived: "בארכיון",
  failed: "לא נקלט",
};

export const uploadStageLabels: Record<UploadStage, string> = {
  reading: "קוראים את המסמך",
  identifying: "מזהים את סוג המסמך",
  extracting: "מחלצים פרטים",
  matching: "מחפשים עובד מתאים",
  action_required: "ממתין להחלטה שלך",
  completed: "הושלם",
  failed: "לא הצליח",
};

export const activityTypeLabels: Record<ActivityType, string> = {
  action: "נדרשת פעולה",
  alert: "התראה",
  update: "עדכון",
  processing: "סייקל פעיל",
};

export const extractedFieldLabels: Record<string, string> = {
  fullName: "שם העובד",
  identityNumber: "מספר מזהה",
  title: "כותרת המסמך המקורית",
  typeId: "סוג מסמך",
  credentialNumber: "מספר תעודה",
  issuer: "גוף מנפיק",
  issuedOn: "תאריך הנפקה",
  validFrom: "בתוקף מ־",
  expiresOn: "בתוקף עד",
  permissionsHe: "היקפים והרשאות",
  restrictionsHe: "הגבלות",
};

export const copy = {
  appTitle: "פעילות",
  appName: "סרטיפי",
  settingsTitle: "הגדרות",
  employeesTitle: "עובדים",
  navFeed: "פיד",
  navCreate: "יצירה",
  navUsers: "משתמשים",
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
  employeeCardTitle: "עובד",
  openEmployeePage: "כניסה לעמוד העובד",
  identityNumberLabel: "מספר מזהה",
  employeeNotFound: "העובד לא נמצא",
  postActionsTitle: "פעולות",
  viewEmployee: "צפייה בעובד",
  uploadNew: "העלה אישור חדש",
  openProcessing: "פתח עיבוד",
  processingSupport: "קוראים ומחלצים את פרטי המסמכים",
  resultListTitle: "תוצאות",
  resultListEmpty: "אין פריטים להצגה",
  decisionReplacementTitle: "החלטה על המסמך",
  confirmExpiryTitle: "אישור תאריך תוקף",
  evidenceCropLabel: "קטע מהמסמך",
  assignedToast: (title: string, name: string) => `שייכנו ${title} ל${name}`,
  replacedToast: (name: string) => `אישור חדש החליף את האישור הקודם של ${name}`,
  replacedFeedTitle: "אישור חדש החליף את האישור הקודם",
  assignedFeedTitle: (title: string) => `שייכנו ${title}`,

  // Employees screen
  employeesSearchPlaceholder: "חיפוש לפי שם, מספר מזהה או תיאור",
  employeesEmptyTitle: "עדיין אין עובדים בתיק",
  employeesEmptyBody: "הוסיפו עובד ראשון או העלו מסמך ונזהה אותו בשבילכם.",
  employeesNoResultsTitle: "לא נמצאו תוצאות",
  employeesNoResultsBody: (query: string) => `לא נמצא עובד שמתאים ל־”${query}”`,
  newEmployee: "עובד חדש",
  selectMode: "בחירה",
  cancelSelection: "ביטול",
  selectedCount: (n: number) => (n === 1 ? "עובד אחד נבחר" : `${n} עובדים נבחרו`),
  continueToShare: "המשך לשיתוף",
  selectEmployeesHint: "בחרו עובדים לשיתוף מסמכים",
  pickEmployeeForDetails: "בחרו עובד מהרשימה כדי לראות את הפרטים",

  // Employee details
  sectionAttention: "דורש טיפול",
  sectionActive: "מסמכים פעילים",
  sectionHistory: "היסטוריה",
  editProfile: "עריכת פרופיל",
  shareAction: "שיתוף",
  uploadForEmployee: "העלאת מסמך",
  noExpiryDate: "ללא תאריך תוקף",
  supersededLabel: "הוחלף",
  noDocumentsYetTitle: "טרם הועלו מסמכים",
  noDocumentsYetBody: "העלו מסמך ראשון ונשייך אותו לעובד הזה.",
  employeeSince: (date: string) => `נוסף בתאריך ${date}`,

  // Employee form
  formCreateTitle: "עובד חדש",
  formEditTitle: "עריכת פרופיל",
  formFullName: "שם מלא",
  formIdentity: "מספר מזהה",
  formDescription: "תיאור קצר",
  formProfileImage: "תמונת פרופיל",
  formFromGallery: "בחירה מהגלריה",
  formTakePhoto: "צילום תמונה",
  formRemoveImage: "הסרת תמונה",
  formSave: "שמירה",
  formSaving: "שומרים…",
  formCancel: "ביטול",
  formRequiredName: "צריך למלא שם מלא",
  formRequiredIdentity: "צריך למלא מספר מזהה",
  formInvalidIdentity: "מספר מזהה צריך להכיל 5 עד 12 ספרות",
  formDuplicateIdentity: "כבר קיים עובד עם המספר המזהה הזה",
  formCreatedToast: (name: string) => `${name} נוסף לתיק`,
  formUpdatedToast: "הפרופיל עודכן",
  formPrefilledHint: "הפרטים חולצו מהמסמך שהועלה. בדקו ותקנו אם צריך.",

  // Document viewer
  viewerOriginalSection: "המסמך המקורי",
  viewerExtractedSection: "פרטים שחולצו",
  viewerFileName: "שם הקובץ",
  viewerFileType: "סוג קובץ",
  viewerFileSize: "גודל",
  viewerPages: "עמודים",
  viewerUploadedOn: "הועלה בתאריך",
  viewerUncertainHint: "שדות מסומנים חולצו בוודאות חלקית וכדאי לאמת אותם מול המסמך",
  viewerReadOnly: "מסמך היסטורי · לצפייה בלבד",
  viewerShowPrevious: "הצג מסמך קודם",
  viewerCompleteDetails: "השלם פרטים",
  viewerPrepareRenew: "הכן בקשת חידוש",
  viewerClose: "סגור",
  viewerStatusLabel: "סטטוס",
  viewerExpiryInterpretation: "פרשנות תוקף",

  // Activity action sheet
  sheetRelatedEmployee: "עובד מקושר",
  sheetRelatedDocument: "מסמך מקושר",
  sheetDocumentSection: "מסמך",
  sheetInsightsSection: "תובנות",
  sheetEvidence: "מה זיהינו במסמך",
  sheetInsightUncertainExpiry:
    "תאריך התפוגה לא נקרא בוודאות, ולכן עדיין אי אפשר לעקוב אחרי תוקף המסמך. אשרו את התאריך כדי להשלים את הקליטה.",
  sheetInsightUncertainField:
    "פרט שחולץ מהמסמך דורש אישור ידני. בדקו את הערך והשלימו אותו כדי שהמסמך יישמר כפעיל.",
  sheetInsightSelectEmployee:
    "זוהו כמה עובדים שעשויים להתאים למסמך. בחרו למי לשייך אותו כדי להשלים את הקליטה.",
  sheetInsightCreateEmployee:
    "הפרטים שזוהו במסמך אינם תואמים עובד קיים. צרו עובד חדש כדי לשייך אליו את המסמך.",
  sheetInsightUnreadable:
    "הקובץ אינו קריא מספיק לקליטה. העלו צילום חד וברור יותר כדי שנוכל לזהות את הפרטים.",
  sheetInsightReplacement:
    "המסמך החדש עשוי להחליף מסמך קיים בתיק. החליטו אם להחליף את הקודם או להשאיר את שניהם פעילים.",
  sheetInsightRenew:
    "המסמך פג תוקף או עומד לפוג. אפשר לשלוח לעובד בקשת חידוש או להעלות מסמך מעודכן.",
  sheetResolvedToast: "הטיפול הושלם",
  selectEmployeeTitle: "למי לשייך את המסמך?",
  selectEmployeeHint: "אלה העובדים שהכי מתאימים למה שזיהינו",
  createNewEmployeeAction: "צור עובד חדש",
  confirmFieldTitle: "אישור פרט שחולץ",
  confirmFieldExtracted: "הערך שזיהינו",
  confirmFieldConfirm: "אישור הערך",
  confirmFieldFix: "שמירת תיקון",
  replaceFileAction: "העלאת קובץ חדש",
  keepBothAction: "שמור את שני האישורים כפעילים",
  replacePreviousAction: "האישור החדש מחליף את הקודם",
  discardDuplicateAction: "זה כפילות, אל תשמור",
  keepSeparateAction: "שמור כמסמך נפרד",
  remindLaterAction: "הזכר לי מאוחר יותר",
  remindLaterToast: "נזכיר שוב מאוחר יותר",
  viewResultAction: "צפייה בתוצאה",
  copyMessageAction: "העתק הודעה לעובד",
  copiedToast: "ההודעה הועתקה",
  linkCopiedToast: "הקישור הועתק",
  nativeShareAction: "שיתוף",
  uploadMyselfAction: "העלה מסמך בעצמי",
  renewMessageLabel: "הודעה מוכנה לשליחה",
  renewLinkLabel: "קישור העלאה מאובטח",
  requestSentFeedTitle: (name: string) => `נשלחה בקשת חידוש ל${name}`,
  requestCreatedToast: "הבקשה מוכנה לשליחה",

  // Share
  shareTitle: "שיתוף מסמכים",
  shareGenerating: "יוצרים קישור מאובטח…",
  shareReady: "הקישור מוכן",
  shareCopyLink: "העתקת קישור",
  shareOpenPreview: "פתיחת תצוגה מקדימה",
  shareExpiryNote: (date: string) => `הקישור בתוקף עד ${date}`,
  shareExpiringMark: "לקראת פקיעה",
  shareExpiredOff: "פג תוקף · לא נכלל כברירת מחדל",
  shareNoDocuments: "אין מסמכים שאפשר לשתף",
  shareCreateLink: "יצירת קישור",
  shareDocsCount: (n: number) => (n === 1 ? "מסמך אחד נבחר" : `${n} מסמכים נבחרו`),

  // Public share page
  publicShareTitle: "תיק מסמכים משותף",
  publicShareBy: "שותף באמצעות סרטיפי",
  publicShareExpired: "הקישור הזה כבר לא בתוקף",
  publicShareInvalid: "הקישור לא נמצא",
  publicShareInvalidBody: "ייתכן שהקישור שגוי או שהשיתוף בוטל.",
  publicShareEmpty: "החבילה הזו לא כוללת מסמכים",
  publicDownload: "הורדה",
  publicDownloadToast: "בגרסת הדגמה ההורדה מדומה",

  // Public request page
  requestPageTitle: "העלאת מסמך",
  requestExplanation: (employer: string) =>
    `${employer} ביקשו ממך להעלות מסמך מעודכן. הקובץ יישלח ישירות לתיק המסמכים שלך.`,
  requestPrivacyNote:
    "הקובץ ישמש רק לניהול המסמכים שלך אצל המעסיק ולא ישותף עם גורם אחר.",
  requestUploadCta: "צילום או העלאת קובץ",
  requestUploading: "מעלים את הקובץ…",
  requestProcessingNote: "קיבלנו את הקובץ ואנחנו מעבדים אותו",
  requestSuccessTitle: "המסמך התקבל, תודה!",
  requestSuccessBody: "המעסיק יקבל עדכון אוטומטי ברגע שהמסמך ייקלט בתיק.",
  requestExpiredTitle: "הקישור כבר לא בתוקף",
  requestExpiredBody: "אפשר לבקש קישור חדש ממי ששלח לך את ההודעה.",
  requestInvalidTitle: "הקישור לא נמצא",
  requestCompletedTitle: "המסמך כבר הועלה",
  requestCompletedBody: "הבקשה הזו כבר טופלה. אין צורך להעלות שוב.",
  requestCancelledTitle: "הבקשה בוטלה",
  requestCancelledBody: "מי ששלח את הבקשה ביטל אותה.",
  requestFileError: "לא הצלחנו לקלוט את הקובץ. נסו קובץ אחר.",
  requestExpiresOn: (date: string) => `הבקשה בתוקף עד ${date}`,
  requestedDocLabel: "המסמך המבוקש",

  // Demo switcher
  demoTitle: "בקרת דמו",
  demoNextOutcome: "תוצאת ההעלאה הבאה",
  demoReset: "איפוס נתוני הדגמה",
  demoResetDone: "הנתונים אופסו",
  demoTriggerAction: "יצירת אירוע לטיפול",
  demoAddExpiring: "הוסף מסמך לקראת פקיעה",
  demoAddExpired: "הוסף מסמך פג תוקף",
  demoShareToken: "צור קישור שיתוף",
  demoRequestToken: "צור בקשת מסמך",
  demoForceState: "מצב תצוגה כפוי",
  demoPauseJobs: "השהה עיבוד",
  demoResumeJobs: "המשך עיבוד",
  demoCompleteJobs: "השלם את כל העיבודים",
};

/** Short decision explanation — not a raw document transcription. */
export function sheetInsightHe(item: ActivityItem): string | undefined {
  switch (item.actionKind) {
    case "confirm_field":
      return item.fieldKey === "expiresOn"
        ? copy.sheetInsightUncertainExpiry
        : copy.sheetInsightUncertainField;
    case "select_employee":
      return copy.sheetInsightSelectEmployee;
    case "create_employee":
      return copy.sheetInsightCreateEmployee;
    case "replace_file":
      return copy.sheetInsightUnreadable;
    case "confirm_replacement":
      return copy.sheetInsightReplacement;
    default:
      return undefined;
  }
}
