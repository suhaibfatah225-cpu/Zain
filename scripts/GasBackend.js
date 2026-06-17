/*
  =============================================================================
  ملف: Google Apps Script Backend (Code.gs)
  =============================================================================
  هذا الكود مخصص لبيئة "Google Apps Script". 
  الدور: إدارة قاعدة بيانات المستخدمين والصلاحيات عبر Google Sheets.
  
  التعليمات:
  1. افتح Google Sheet جديدة.
  2. اضغط على Extensions -> Apps Script.
  3. استبدل الكود الموجود بهذا الكود.
  4. اضغط على Deploy -> New Deployment -> Web App.
  5. اضبط الدخول ليكون "Anyone".
  =============================================================================
*/

/**
 * دالة التهيئة: تنشئ شيت "Users" إذا كانت غير موجودة وتضيف العناوين.
 */
function initialSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Users");
  
  if (!sheet) {
    sheet = ss.insertSheet("Users");
    sheet.appendRow(["Email", "Name", "Role", "DateAdded"]);
    // تنسيق العناوين
    sheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#f0f0f0");
    // تجميد الصف الأول
    sheet.setFrozenRows(1);
    
    // إضافة المدير الافتراضي
    sheet.appendRow(["ahmedzayn.x@gmail.com", "أحمد محمود زين", "Admin", new Date()]);
  }
  return "نظام الصلاحيات جاهز للعمل";
}

/**
 * دالة التحقق من صلاحية المستخدم الحالي (Current Session User).
 */
function checkUserAccess() {
  const email = Session.getActiveUser().getEmail();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Users");
  
  if (!sheet) return { status: "Error", message: "Database not initialized" };
  
  const data = sheet.getDataRange().getValues();
  
  // البحث عن المستخدم بالإيميل
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0].toLowerCase() === email.toLowerCase()) {
      return {
        status: "Authorized",
        email: row[0],
        name: row[1],
        role: row[2]
      };
    }
  }
  
  // إذا لم يتم العثور عليه
  return {
    status: "Denied",
    email: email,
    message: "عذراً، ليس لديك صلاحية للدخول، يرجى التواصل مع المدير (أحمد زين)"
  };
}

/**
 * إضافة مستخدم جديد (للمدير فقط).
 */
function addNewUserByAdmin(email, name, role) {
  // التأكد من أن المنفذ هو مدير
  const caller = checkUserAccess();
  if (caller.role !== "Admin") {
    throw new Error("عذراً، هذه العملية متاحة للمدير فقط");
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Users");
  
  // التحقق من عدم تكرار الإيميل
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toLowerCase() === email.toLowerCase()) {
      throw new Error("هذا البريد الإلكتروني مسجل مسبقاً");
    }
  }
  
  sheet.appendRow([email, name, role, new Date()]);
  return "تم إضافة الموظف " + name + " بصلاحية " + role + " بنجاح";
}
