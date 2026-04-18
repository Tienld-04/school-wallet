package com.ldt.user.context;

public class UserContext {
    private static final ThreadLocal<String> userId = new ThreadLocal<>();
    private static final ThreadLocal<String> role = new ThreadLocal<>();

    public static void setUserId(String id) { userId.set(id); }
    public static String getUserId() { return userId.get(); }

    public static void setRole(String r) { role.set(r); }
    public static String getRole() { return role.get(); }

    public static void clear() {
        userId.remove();
        role.remove();
    }
}
