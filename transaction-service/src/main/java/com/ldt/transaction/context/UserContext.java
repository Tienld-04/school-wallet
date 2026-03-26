package com.ldt.transaction.context;


public class UserContext {
    private static final ThreadLocal<String> userId = new ThreadLocal<>();
    private static final ThreadLocal<String> userPhone = new ThreadLocal<>();
    private static final ThreadLocal<String> role = new ThreadLocal<>();

    public static void setUserId(String id) { userId.set(id); }
    public static String getUserId() { return userId.get(); }

    public static void setUserPhone(String phone) { userPhone.set(phone); }
    public static String getUserPhone() { return userPhone.get(); }

    public static void setRole(String r) { role.set(r); }
    public static String getRole() { return role.get(); }

    public static void clear() {
        userId.remove();
        userPhone.remove();
        role.remove();
    }
}
