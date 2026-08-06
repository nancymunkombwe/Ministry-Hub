export const canManageUsers = (role) => {
    return role === "admin";
};

export const canManageMembers = (role) => {
    return role === "admin" || role === "leader";
};

export const canManageVisitors = (role) => {
    return role === "admin" || role === "leader";
};

export const canManageDepartments = (role) => {
    return role === "admin" || role === "leader";
};

export const canManageAttendance = (role) => {
    return role === "admin" || role === "leader";
};

export const canManageEvents = (role) => {
    return role === "admin" || role === "leader";
};

export const canManageAnnouncements = (role) => {
    return role === "admin" || role === "leader";
};

export const canManageContributions = (role) => {
    return role === "admin" || role === "treasurer";
};

export const canManageCareFollowups = (role) => {
    return role === "admin" || role === "leader";
};

export const canManageTasks = (role) => {
    return role === "admin" || role === "leader";
};

export const getNoPermissionMessage = () => {
    return "You can view this page, but your role is not allowed to make changes here.";
};