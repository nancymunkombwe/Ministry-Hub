import { useEffect, useMemo, useRef, useState } from "react";
import {
    FaChartLine,
    FaUsers,
    FaUserPlus,
    FaClipboardCheck,
    FaHandHoldingUsd,
    FaHeart,
    FaTasks,
    FaCalendarAlt,
    FaBullhorn,
    FaSyncAlt,
    FaPrint
} from "react-icons/fa";

import API from "../api/api";
import { useAuth } from "../context/AuthContext";

const Reports = () => {
    const { user } = useAuth();

    const role = user?.role || "admin";
    const canViewFinance = role === "admin" || role === "treasurer";

    const today = new Date();

    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(
        today.getMonth() + 1
    );

    const [useCustomRange, setUseCustomRange] = useState(false);
    const [customFrom, setCustomFrom] = useState(
        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`
    );
    const [customTo, setCustomTo] = useState(
        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
    );

    const [dashboard, setDashboard] = useState(null);
    const [churchHealth, setChurchHealth] = useState(null);
    const [memberReport, setMemberReport] = useState(null);
    const [attendanceReport, setAttendanceReport] = useState(null);
    const [contributionReport, setContributionReport] = useState(null);
    const [visitorReport, setVisitorReport] = useState(null);

    const [members, setMembers] = useState([]);
    const [visitors, setVisitors] = useState([]);
    const [attendanceSessions, setAttendanceSessions] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [contributions, setContributions] = useState([]);
    const [events, setEvents] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [careFollowups, setCareFollowups] = useState([]);
    const [tasks, setTasks] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [previewHtml, setPreviewHtml] = useState("");
    const [previewTitle, setPreviewTitle] = useState("");
    const previewFrameRef = useRef(null);

    const monthName = useCustomRange
        ? `${customFrom} to ${customTo}`
        : new Date(
              selectedYear,
              selectedMonth - 1,
              1
          ).toLocaleString("en-US", {
              month: "long"
          });

    /* =========================================================
       HELPERS
    ========================================================= */

    const formatDate = (value) => {
        if (!value) return "-";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value).split("T")[0];
        }

        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const formatMoney = (value) =>
        `K${Number(value || 0).toLocaleString("en-ZM", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

    const getArray = (response, keys = []) => {
        for (const key of keys) {
            if (Array.isArray(response?.data?.[key])) {
                return response.data[key];
            }
        }

        return Array.isArray(response?.data)
            ? response.data
            : [];
    };

    const getObject = (response, keys = []) => {
        for (const key of keys) {
            if (response?.data?.[key]) {
                return response.data[key];
            }
        }

        return response?.data || null;
    };

    const getMemberName = (member) =>
        `${member?.first_name || ""} ${
            member?.last_name || ""
        }`.trim() || "-";

    const getVisitorName = (visitor) =>
        `${visitor?.first_name || ""} ${
            visitor?.last_name || ""
        }`.trim() || "-";

    /* =========================================================
       REPORT PERIOD HELPERS
    ========================================================= */

    const getDateValue = (record, keys = []) => {
        for (const key of keys) {
            if (record?.[key]) return record[key];
        }
        return null;
    };

    const parseDate = (value) => {
        if (!value) return null;

        const raw = String(value);
        const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

        if (match) {
            const [, year, month, day] = match;

            return new Date(
                Number(year),
                Number(month) - 1,
                Number(day)
            );
        }

        const date = new Date(value);

        return Number.isNaN(date.getTime())
            ? null
            : date;
    };

    const periodStart = useMemo(
        () => {
            if (useCustomRange) {
                const value = new Date(`${customFrom}T00:00:00`);
                return Number.isNaN(value.getTime())
                    ? new Date()
                    : value;
            }

            return new Date(
                Number(selectedYear),
                Number(selectedMonth) - 1,
                1,
                0,
                0,
                0,
                0
            );
        },
        [useCustomRange, customFrom, selectedYear, selectedMonth]
    );

    const periodEnd = useMemo(
        () => {
            if (useCustomRange) {
                const value = new Date(`${customTo}T23:59:59.999`);
                return Number.isNaN(value.getTime())
                    ? new Date()
                    : value;
            }

            return new Date(
                Number(selectedYear),
                Number(selectedMonth),
                0,
                23,
                59,
                59,
                999
            );
        },
        [useCustomRange, customTo, selectedYear, selectedMonth]
    );

    const periodFrom = useCustomRange
        ? customFrom
        : `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;

    const periodTo = useCustomRange
        ? customTo
        : (() => {
              const lastDay = new Date(
                  selectedYear,
                  selectedMonth,
                  0
              ).getDate();

              return `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
          })();

    const inSelectedMonth = (value) => {
        const date = parseDate(value);

        if (!date) return false;

        return date >= periodStart && date <= periodEnd;
    };

    const getMemberJoinDate = (member) =>
        getDateValue(member, [
            "date_joined_church"
        ]);

    const getMemberExitDate = (member) =>
        getDateValue(member, [
            "leave_date",
            "date_left",
            "membership_end_date",
            "end_date",
            "transferred_date",
            "deleted_at"
        ]);

    /*
     * A member belongs in a historical period when they had
     * joined by the end of that period and had not left before it.
     *
     * Legacy records without a join date are retained because
     * there is not enough information to prove they were absent.
     */
    const memberExistedDuringPeriod = (member) => {
        const joinDate = parseDate(getMemberJoinDate(member));
        const exitDate = parseDate(getMemberExitDate(member));

        // A missing join date does not prove that a current member was
        // absent from the selected period. Keep the member in the
        // reporting population and disclose the missing date separately.
        if (!joinDate) {
            return !exitDate || exitDate >= periodStart;
        }

        if (joinDate > periodEnd) {
            return false;
        }

        if (exitDate && exitDate < periodStart) {
            return false;
        }

        return true;
    };

    const memberJoinedInPeriod = (member) => {
        const joinDate = parseDate(getMemberJoinDate(member));

        return (
            joinDate &&
            joinDate >= periodStart &&
            joinDate <= periodEnd
        );
    };

    const memberLeftInPeriod = (member) => {
        const exitDate = parseDate(getMemberExitDate(member));

        return (
            exitDate &&
            exitDate >= periodStart &&
            exitDate <= periodEnd
        );
    };

    const groupCount = (rows, getKey, fallback = "Not specified") => {
        const counts = new Map();

        rows.forEach((row) => {
            const key =
                String(getKey(row) || fallback).trim() ||
                fallback;

            counts.set(key, (counts.get(key) || 0) + 1);
        });

        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([label, total]) => ({
                label,
                total
            }));
    };

    const escapeHtml = (value) =>
        String(value ?? "-")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    /* =========================================================
       FETCH REPORT DATA
    ========================================================= */

    const fetchReports = async () => {
        setLoading(true);
        setError("");

        try {
            if (periodFrom > periodTo) {
                throw new Error("The start date cannot be after the end date.");
            }

            /*
             * Load the actual records from the Ministry Hub modules.
             *
             * These are deliberately loaded independently so that
             * one unavailable endpoint does not prevent the other
             * reports from displaying.
             */
            const rangeQuery = `from=${periodFrom}&to=${periodTo}`;

            const requests = [
                API.get(`/reports/dashboard?${rangeQuery}`),
                API.get(`/reports/church-health?${rangeQuery}`),
                API.get(`/reports/members?${rangeQuery}`),
                API.get(
                    `/reports/attendance?${rangeQuery}&details=true`
                ),
                API.get(
                    `/reports/visitors?${rangeQuery}&details=true`
                ),
                API.get("/reports/upcoming-events"),
                API.get("/reports/recent-announcements"),

                API.get("/members"),
                API.get("/visitors"),
                API.get("/attendance/sessions"),
                API.get("/contributions"),
                API.get("/events"),
                API.get("/announcements"),
                API.get("/care"),
                API.get("/tasks")
            ];

            if (canViewFinance) {
                requests.push(
                    API.get(
                        `/reports/contributions?${rangeQuery}&details=true`
                    )
                );
            }

            const results = await Promise.allSettled(requests);

            const fulfilled = (index) =>
                results[index]?.status === "fulfilled"
                    ? results[index].value
                    : null;

            /* =====================================================
               OPTIONAL / PRE-CALCULATED REPORT ENDPOINTS
            ===================================================== */

            setDashboard(
                fulfilled(0)
                    ? getObject(fulfilled(0), [
                          "dashboard",
                          "data",
                          "report"
                      ])
                    : null
            );

            setChurchHealth(
                fulfilled(1)
                    ? getObject(fulfilled(1), [
                          "church_health",
                          "health",
                          "data",
                          "report"
                      ])
                    : null
            );

            setMemberReport(
                fulfilled(2)
                    ? fulfilled(2).data
                    : null
            );

            setAttendanceReport(
                fulfilled(3)
                    ? fulfilled(3).data
                    : null
            );

            setVisitorReport(
                fulfilled(4)
                    ? fulfilled(4).data
                    : null
            );

            /* =====================================================
               ACTUAL MODULE RECORDS
            ===================================================== */

            setMembers(
                fulfilled(7)
                    ? getArray(fulfilled(7), [
                          "members",
                          "data"
                      ])
                    : []
            );

            setVisitors(
                fulfilled(8)
                    ? getArray(fulfilled(8), [
                          "visitors",
                          "data"
                      ])
                    : []
            );

            const sessions = fulfilled(9)
                ? getArray(fulfilled(9), [
                      "sessions",
                      "attendance_sessions",
                      "data"
                  ])
                : [];

            setAttendanceSessions(sessions);

            setContributions(
                fulfilled(10)
                    ? getArray(fulfilled(10), [
                          "contributions",
                          "data"
                      ])
                    : []
            );

            setEvents(
                fulfilled(11)
                    ? getArray(fulfilled(11), [
                          "events",
                          "data"
                      ])
                    : []
            );

            setAnnouncements(
                fulfilled(12)
                    ? getArray(fulfilled(12), [
                          "announcements",
                          "data"
                      ])
                    : []
            );

            setCareFollowups(
                fulfilled(13)
                    ? getArray(fulfilled(13), [
                          "care_followups",
                          "careFollowups",
                          "data"
                      ])
                    : []
            );

            setTasks(
                fulfilled(14)
                    ? getArray(fulfilled(14), [
                          "tasks",
                          "data"
                      ])
                    : []
            );

            /* =====================================================
               FINANCE REPORT
            ===================================================== */

            if (canViewFinance) {
                const financeIndex = 15;

                setContributionReport(
                    fulfilled(financeIndex)
                        ? fulfilled(financeIndex).data
                        : null
                );
            } else {
                setContributionReport(null);
            }

            /* =====================================================
               LOAD ACTUAL ATTENDANCE RECORDS
            ===================================================== */

            const monthSessions = sessions.filter((session) =>
                inSelectedMonth(session.session_date)
            );

            const recordResults = await Promise.allSettled(
                monthSessions.map((session) =>
                    API.get(
                        `/attendance/sessions/${
                            session.id || session.session_id
                        }/records`
                    )
                )
            );

            const rows = [];

            recordResults.forEach((result, index) => {
                if (result.status !== "fulfilled") return;

                const records = getArray(result.value, [
                    "records",
                    "attendance_records",
                    "data"
                ]);

                records.forEach((record) => {
                    rows.push({
                        ...record,
                        session_date:
                            monthSessions[index].session_date,
                        service_type:
                            monthSessions[index].service_type,
                        department_name:
                            monthSessions[index].department_name,
                        session_id:
                            monthSessions[index].id ||
                            monthSessions[index].session_id
                    });
                });
            });

            setAttendanceRecords(rows);

            /*
             * Only show the global error when ALL module requests
             * failed.
             */
            const failedRequests = results.filter(
                (result) =>
                    result.status === "rejected"
            );

            if (failedRequests.length === requests.length) {
                throw new Error(
                    "Unable to load the Ministry Hub records. Please check that the backend is running."
                );
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    err.message ||
                    "Some report information could not be loaded."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        selectedYear,
        selectedMonth,
        useCustomRange,
        customFrom,
        customTo,
        canViewFinance
    ]);

    /* =========================================================
       DERIVED DATA
    ========================================================= */

    /*
     * Members are different from transactions:
     * the member register is a current-state dataset, while a
     * historical report should use the population that existed
     * during the selected period.
     */
    const selectedMembers = useMemo(
        () =>
            members.filter((member) =>
                memberExistedDuringPeriod(member)
            ),
        [
            members,
            periodStart,
            periodEnd
        ]
    );

    const currentMembers = useMemo(
        () => members,
        [members]
    );

    const membersWithoutJoinDate = useMemo(
        () =>
            selectedMembers.filter(
                (member) => !parseDate(getMemberJoinDate(member))
            ),
        [selectedMembers]
    );

    const joinedMembers = useMemo(
        () =>
            members.filter((member) =>
                memberJoinedInPeriod(member)
            ),
        [
            members,
            periodStart,
            periodEnd
        ]
    );

    const departedMembers = useMemo(
        () =>
            members.filter((member) =>
                memberLeftInPeriod(member)
            ),
        [
            members,
            periodStart,
            periodEnd
        ]
    );

    const selectedVisitors = useMemo(
        () =>
            visitors.filter((visitor) =>
                inSelectedMonth(
                    visitor.visit_date
                )
            ),
        [
            visitors,
            selectedYear,
            selectedMonth,
            periodStart,
            periodEnd
        ]
    );

    const selectedContributions = useMemo(
        () =>
            contributions.filter((item) =>
                inSelectedMonth(
                    item.contribution_date
                )
            ),
        [
            contributions,
            selectedYear,
            selectedMonth,
            periodStart,
            periodEnd
        ]
    );

    const selectedSessions = useMemo(
        () =>
            attendanceSessions.filter((session) =>
                inSelectedMonth(
                    session.session_date
                )
            ),
        [
            attendanceSessions,
            selectedYear,
            selectedMonth,
            periodStart,
            periodEnd
        ]
    );

    const selectedAttendanceRecords = useMemo(
        () =>
            attendanceRecords.filter((record) =>
                inSelectedMonth(
                    record.session_date
                )
            ),
        [
            attendanceRecords,
            selectedYear,
            selectedMonth,
            periodStart,
            periodEnd
        ]
    );

    /*
     * The selected period controls the Events report too.
     * This prevents a historical report from displaying only
     * today's future events.
     */
    const selectedEvents = useMemo(
        () =>
            events
                .filter((event) =>
                    inSelectedMonth(
                        event.event_date
                    )
                )
                .sort(
                    (a, b) =>
                        (parseDate(
                            a.event_date ||
                                a.date ||
                                a.start_date
                        )?.getTime() || 0) -
                        (parseDate(
                            b.event_date ||
                                b.date ||
                                b.start_date
                        )?.getTime() || 0)
                ),
        [
            events,
            selectedYear,
            selectedMonth,
            periodStart,
            periodEnd
        ]
    );

    const selectedAnnouncements = useMemo(
        () =>
            announcements
                .filter((announcement) =>
                    inSelectedMonth(
                        announcement.announcement_date ||
                            announcement.created_at ||
                            announcement.date
                    )
                )
                .sort(
                    (a, b) =>
                        (parseDate(
                            b.announcement_date ||
                                b.created_at ||
                                b.date
                        )?.getTime() || 0) -
                        (parseDate(
                            a.announcement_date ||
                                a.created_at ||
                                a.date
                        )?.getTime() || 0)
                ),
        [
            announcements,
            selectedYear,
            selectedMonth,
            periodStart,
            periodEnd
        ]
    );

    const selectedCareFollowups = useMemo(
        () =>
            careFollowups.filter((care) =>
                inSelectedMonth(
                    care.due_date ||
                        care.follow_up_date ||
                        care.date ||
                        care.created_at
                )
            ),
        [
            careFollowups,
            selectedYear,
            selectedMonth,
            periodStart,
            periodEnd
        ]
    );

    const selectedTasks = useMemo(
        () =>
            tasks.filter((task) =>
                inSelectedMonth(
                    task.due_date
                )
            ),
        [
            tasks,
            selectedYear,
            selectedMonth,
            periodStart,
            periodEnd
        ]
    );

    const totalContributionAmount =
        selectedContributions.reduce(
            (sum, item) =>
                sum + Number(item.amount || 0),
            0
        );

    const presentCount =
        selectedAttendanceRecords.filter(
            (record) =>
                String(record.status)
                    .toLowerCase() ===
                "present"
        ).length;

    const absentCount =
        selectedAttendanceRecords.filter(
            (record) =>
                String(record.status)
                    .toLowerCase() ===
                "absent"
        ).length;

    const attendanceRate =
        presentCount + absentCount > 0
            ? Math.round(
                  (presentCount /
                      (presentCount +
                          absentCount)) *
                      100
              )
            : 0;

    const baptismRows =
        memberReport?.baptism_summary || [];

    const departmentRows =
        memberReport?.department_summary || [];

    const attendanceRows =
        attendanceReport?.status_summary ||
        [];

    const contributionRows = useMemo(() => {
        const grouped = {};

        selectedContributions.forEach((contribution) => {
            const category =
                contribution.contribution_category ||
                contribution.contribution_type ||
                contribution.category ||
                "Other";

            if (!grouped[category]) {
                grouped[category] = {
                    contribution_category: category,
                    number_of_records: 0,
                    total_amount: 0
                };
            }

            grouped[category].number_of_records += 1;
            grouped[category].total_amount += Number(
                contribution.amount || 0
            );
        });

        return Object.values(grouped).sort(
            (a, b) => b.total_amount - a.total_amount
        );
    }, [selectedContributions]);

    const visitorRows =
        visitorReport?.follow_up_summary || [];

    const carePending =
        careFollowups.filter((item) =>
            [
                "Pending",
                "In Progress"
            ].includes(item.status)
        ).length;

    const taskPending =
        tasks.filter((item) =>
            [
                "Pending",
                "In Progress"
            ].includes(item.status)
        ).length;

    const selectedCarePending =
        selectedCareFollowups.filter((item) =>
            [
                "Pending",
                "In Progress"
            ].includes(item.status)
        ).length;

    const selectedTaskPending =
        selectedTasks.filter((item) =>
            [
                "Pending",
                "In Progress"
            ].includes(item.status)
        ).length;

    const getMemberStatus = (member) =>
        member.membership_status ||
        member.status ||
        "Not specified";

    const getBaptismStatus = (member) =>
        member.baptism_status ||
        (member.baptism_date ? "Baptized" : "Not recorded");

    const getDepartmentName = (member) =>
        member.department_name ||
        member.department ||
        member.department_title ||
        "Not assigned";

    const memberStatusRows = groupCount(
        selectedMembers,
        getMemberStatus
    );

    const currentActiveMembers =
        currentMembers.filter((member) =>
            String(getMemberStatus(member))
                .trim()
                .toLowerCase() === "active"
        ).length;

    const baptismSummary = groupCount(
        selectedMembers,
        getBaptismStatus
    );

    const departmentSummary = groupCount(
        selectedMembers,
        getDepartmentName
    );

    /* =========================================================
       PRINT HELPERS
    ========================================================= */

    const table = (headers, rows) => {
        if (!rows.length) {
            return `
                <div class="empty">
                    No records available for this report.
                </div>
            `;
        }

        return `
            <table>
                <thead>
                    <tr>
                        ${headers
                            .map(
                                (header) =>
                                    `<th>${escapeHtml(
                                        header
                                    )}</th>`
                            )
                            .join("")}
                    </tr>
                </thead>

                <tbody>
                    ${rows
                        .map(
                            (row) =>
                                `<tr>
                                    ${row
                                        .map(
                                            (cell) =>
                                                `<td>${cell}</td>`
                                        )
                                        .join("")}
                                </tr>`
                        )
                        .join("")}
                </tbody>
            </table>
        `;
    };

    const reportShell = (
        title,
        subtitle,
        body
    ) => `
        <section class="report-section">
            <div class="report-title">
                <div>
                    <div class="brand">
                        MINISTRY HUB
                    </div>

                    <h1>
                        ${escapeHtml(title)}
                    </h1>

                    <p>
                        ${escapeHtml(subtitle)}
                    </p>
                </div>

                <div class="generated">
                    Generated ${escapeHtml(
                        new Date().toLocaleString()
                    )}
                </div>
            </div>

            ${body}

            <div class="footer">
                Ministry Hub • Church Management System
            </div>
        </section>
    `;

    const section = (
        heading,
        content
    ) => `
        <div class="subsection">
            <h2>
                ${escapeHtml(heading)}
            </h2>

            ${content}
        </div>
    `;

    /* =========================================================
       OVERVIEW REPORT
    ========================================================= */

    const dashboardPrint = () =>
        reportShell(
            "Church Overview Report",
            `Overall church status and ministry activity • ${monthName}`,

            `
            <div class="metric-grid">

                ${[
                    [
                        "Total Members",
                        selectedMembers.length
                    ],

                    [
                        "Active Members",
                        selectedMembers.filter(
                            (member) =>
                                String(
                                    getMemberStatus(member)
                                ).trim().toLowerCase() ===
                                "active"
                        ).length
                    ],

                    [
                        "Total Visitors",
                        selectedVisitors.length
                    ],

                    [
                        "Contributions in Period",
                        formatMoney(
                            totalContributionAmount
                        )
                    ],

                    [
                        "Pending Care Follow-ups",
                        selectedCarePending
                    ],

                    [
                        "Pending Tasks",
                        selectedTaskPending
                    ],

                    [
                        "Missing Members",
                        dashboard?.missing_members ??
                            0
                    ]
                ]
                    .map(
                        ([label, value]) =>
                            `
                            <div class="metric">
                                <span>
                                    ${escapeHtml(
                                        label
                                    )}
                                </span>

                                <strong>
                                    ${escapeHtml(
                                        value
                                    )}
                                </strong>
                            </div>
                            `
                    )
                    .join("")}

            </div>

            ${section(
                "Church Health",

                table(
                    [
                        "Area",
                        "Status / Group",
                        "Total"
                    ],

                    [
                        ...memberStatusRows.map(
                            (row) => [
                                "Members",
                                escapeHtml(
                                    row.membership_status
                                ),
                                escapeHtml(
                                    row.total
                                )
                            ]
                        ),

                        ...(churchHealth?.care_followups ||
                            []).map(
                            (row) => [
                                "Care Follow-ups",
                                escapeHtml(
                                    row.status
                                ),
                                escapeHtml(
                                    row.total
                                )
                            ]
                        ),

                        ...(churchHealth?.tasks ||
                            []).map(
                            (row) => [
                                "Tasks",
                                escapeHtml(
                                    row.status
                                ),
                                escapeHtml(
                                    row.total
                                )
                            ]
                        ),

                        ...(churchHealth?.visitor_followups ||
                            []).map(
                            (row) => [
                                "Visitors",
                                escapeHtml(
                                    row.follow_up_status
                                ),
                                escapeHtml(
                                    row.total
                                )
                            ]
                        )
                    ]
                )
            )}
            `
        );

    /* =========================================================
       MEMBER REPORT
    ========================================================= */

    const membersPrint = () =>
        reportShell(
            "Member Report",
            `${monthName} • ${selectedMembers.length} member(s) in period population • ${membersWithoutJoinDate.length} without a recorded join date`,

            `
            ${section(
                "Membership Overview",

                `
                <div class="metric-grid">

                    <div class="metric">
                        <span>Members in Period</span>
                        <strong>
                            ${escapeHtml(
                                selectedMembers.length
                            )}
                        </strong>
                    </div>

                    <div class="metric">
                        <span>Joined This Period</span>
                        <strong>
                            ${escapeHtml(
                                joinedMembers.length
                            )}
                        </strong>
                    </div>

                    <div class="metric">
                        <span>Left / Transferred</span>
                        <strong>
                            ${escapeHtml(
                                departedMembers.length
                            )}
                        </strong>
                    </div>

                    <div class="metric">
                        <span>Current Active (All Members)</span>
                        <strong>
                            ${escapeHtml(
                                currentActiveMembers
                            )}
                        </strong>
                    </div>

                    <div class="metric">
                        <span>Missing Join Date</span>
                        <strong>
                            ${escapeHtml(
                                membersWithoutJoinDate.length
                            )}
                        </strong>
                    </div>

                </div>
                `
            )}

            ${section(
                "Membership Status",

                table(
                    [
                        "Membership Status",
                        "Members"
                    ],

                    memberStatusRows.map(
                        (row) => [
                            escapeHtml(
                                row.label
                            ),
                            escapeHtml(
                                row.total
                            )
                        ]
                    )
                )
            )}

            ${section(
                "Baptism Summary",

                table(
                    [
                        "Baptism Status",
                        "Members"
                    ],

                    baptismSummary.map(
                        (row) => [
                            escapeHtml(
                                row.label
                            ),
                            escapeHtml(
                                row.total
                            )
                        ]
                    )
                )
            )}

            ${section(
                "Department Membership",

                table(
                    [
                        "Department",
                        "Members"
                    ],

                    departmentSummary.map(
                        (row) => [
                            escapeHtml(
                                row.label
                            ),
                            escapeHtml(
                                row.total
                            )
                        ]
                    )
                )
            )}

            ${section(
                "Reporting Note",

                `
                <div class="empty">
                    This management report summarizes the selected
                    period rather than printing the entire member
                    register. Members without a recorded join date are
                    retained in the period population because the missing
                    date does not prove that they were absent; the number
                    of such records is shown separately above. The
                    operational member register remains available in the
                    Members module, where individual records can be
                    searched and managed.
                </div>
                `
            )}
            `
        );

    /* =========================================================
       ATTENDANCE REPORT
    ========================================================= */

    const attendancePrint = () =>
        reportShell(
            "Attendance Report",
            `Attendance recorded for ${monthName}`,

            `
            ${section(
                "Attendance Overview",

                `
                <div class="metric-grid">

                    <div class="metric">
                        <span>Sessions</span>
                        <strong>
                            ${escapeHtml(
                                selectedSessions.length
                            )}
                        </strong>
                    </div>

                    <div class="metric">
                        <span>Present Records</span>
                        <strong>
                            ${escapeHtml(
                                presentCount
                            )}
                        </strong>
                    </div>

                    <div class="metric">
                        <span>Absent Records</span>
                        <strong>
                            ${escapeHtml(
                                absentCount
                            )}
                        </strong>
                    </div>

                    <div class="metric">
                        <span>Attendance Rate</span>
                        <strong>
                            ${escapeHtml(
                                attendanceRate
                            )}%
                        </strong>
                    </div>

                </div>
                `
            )}

            ${section(
                "Session Summary",

                table(
                    [
                        "Date",
                        "Service",
                        "Department",
                        "Records",
                        "Present",
                        "Absent"
                    ],

                    selectedSessions.map(
                        (session) => {
                            const sessionId =
                                session.id ||
                                session.session_id;

                            const rows =
                                attendanceRecords.filter(
                                    (record) =>
                                        String(
                                            record.session_id
                                        ) ===
                                        String(
                                            sessionId
                                        )
                                );

                            return [
                                escapeHtml(
                                    formatDate(
                                        session.session_date
                                    )
                                ),

                                escapeHtml(
                                    session.service_type
                                ),

                                escapeHtml(
                                    session.department_name
                                ),

                                escapeHtml(
                                    rows.length
                                ),

                                escapeHtml(
                                    rows.filter(
                                        (row) =>
                                            String(
                                                row.status
                                            ).toLowerCase() ===
                                            "present"
                                    ).length
                                ),

                                escapeHtml(
                                    rows.filter(
                                        (row) =>
                                            String(
                                                row.status
                                            ).toLowerCase() ===
                                            "absent"
                                    ).length
                                )
                            ];
                        }
                    )
                )
            )}

            ${section(
                "Attendance Records",

                table(
                    [
                        "Date",
                        "Service",
                        "Member",
                        "Status"
                    ],

                    selectedAttendanceRecords.map(
                        (record) => [
                            escapeHtml(
                                formatDate(
                                    record.session_date
                                )
                            ),

                            escapeHtml(
                                record.service_type
                            ),

                            escapeHtml(
                                `${record.first_name || ""} ${
                                    record.last_name || ""
                                }`.trim()
                            ),

                            escapeHtml(
                                record.status
                            )
                        ]
                    )
                )
            )}
            `
        );

    /* =========================================================
       FINANCE REPORT
    ========================================================= */

    const financePrint = () =>
        reportShell(
            "Tithes & Offerings Report",
            `${monthName} • ${selectedContributions.length} contribution record(s)`,

            `
            ${section(
                "Financial Summary",

                `
                <div class="metric-grid">

                    <div class="metric">
                        <span>
                            Total Contributions
                        </span>

                        <strong>
                            ${escapeHtml(
                                formatMoney(
                                    totalContributionAmount
                                )
                            )}
                        </strong>
                    </div>

                    <div class="metric">
                        <span>
                            Contribution Records
                        </span>

                        <strong>
                            ${escapeHtml(
                                selectedContributions.length
                            )}
                        </strong>
                    </div>

                </div>
                `
            )}

            ${section(
                "By Contribution Category",

                table(
                    [
                        "Category",
                        "Records",
                        "Total"
                    ],

                    contributionRows.map(
                        (row) => [
                            escapeHtml(
                                row.contribution_category
                            ),

                            escapeHtml(
                                row.number_of_records
                            ),

                            escapeHtml(
                                formatMoney(
                                    row.total_amount
                                )
                            )
                        ]
                    )
                )
            )}

            ${section(
                "Contribution Register",

                table(
                    [
                        "Date",
                        "Member",
                        "Category",
                        "Amount",
                        "Recorded By"
                    ],

                    selectedContributions.map(
                        (contribution) => [
                            escapeHtml(
                                formatDate(
                                    contribution.contribution_date
                                )
                            ),

                            escapeHtml(
                                contribution.member_name ||
                                    "General / Anonymous"
                            ),

                            escapeHtml(
                                contribution.contribution_category
                            ),

                            escapeHtml(
                                formatMoney(
                                    contribution.amount
                                )
                            ),

                            escapeHtml(
                                contribution.recorded_by_name
                            )
                        ]
                    )
                )
            )}
            `
        );

    /* =========================================================
       VISITOR REPORT
    ========================================================= */

    const visitorsPrint = () =>
        reportShell(
            "Visitor Report",
            `${monthName} • ${selectedVisitors.length} visitor(s)`,

            `
            ${section(
                "Visitor Summary",

                table(
                    [
                        "Follow-up Status",
                        "Visitors"
                    ],

                    visitorRows.map(
                        (row) => [
                            escapeHtml(
                                row.follow_up_status
                            ),
                            escapeHtml(
                                row.total
                            )
                        ]
                    )
                )
            )}

            ${section(
                "Visitor Register",

                table(
                    [
                        "Visitor",
                        "Visit Date",
                        "Phone",
                        "Email",
                        "Invited By",
                        "Follow-up Status"
                    ],

                    selectedVisitors.map(
                        (visitor) => [
                            `<strong>${escapeHtml(
                                getVisitorName(
                                    visitor
                                )
                            )}</strong>`,

                            escapeHtml(
                                formatDate(
                                    visitor.visit_date
                                )
                            ),

                            escapeHtml(
                                visitor.phone
                            ),

                            escapeHtml(
                                visitor.email
                            ),

                            escapeHtml(
                                visitor.invited_by
                            ),

                            escapeHtml(
                                visitor.follow_up_status
                            )
                        ]
                    )
                )
            )}
            `
        );

    /* =========================================================
       EVENTS REPORT
    ========================================================= */

    const eventsPrint = () =>
        reportShell(
            "Events Report",
            `${monthName} • ${selectedEvents.length} event(s)`,

            section(
                "Upcoming Church Events",

                table(
                    [
                        "Event",
                        "Type",
                        "Date",
                        "Time",
                        "Location",
                        "Department"
                    ],

                    selectedEvents.map(
                        (event) => [
                            `<strong>${escapeHtml(
                                event.title ||
                                    event.name
                            )}</strong>`,

                            escapeHtml(
                                event.event_type ||
                                    event.type
                            ),

                            escapeHtml(
                                formatDate(
                                    event.event_date ||
                                        event.date
                                )
                            ),

                            escapeHtml(
                                event.event_time ||
                                    event.start_time
                            ),

                            escapeHtml(
                                event.location
                            ),

                            escapeHtml(
                                event.department_name ||
                                    event.organizer
                            )
                        ]
                    )
                )
            )
        );

    /* =========================================================
       ANNOUNCEMENTS REPORT
    ========================================================= */

    const announcementsPrint = () =>
        reportShell(
            "Announcements Report",
            `${monthName} • ${selectedAnnouncements.length} announcement(s)`,

            section(
                "Recent Church Announcements",

                table(
                    [
                        "Date",
                        "Title",
                        "Message",
                        "Audience",
                        "Priority",
                        "Status"
                    ],

                    selectedAnnouncements.map(
                        (announcement) => [
                            escapeHtml(
                                formatDate(
                                    announcement.announcement_date ||
                                        announcement.created_at
                                )
                            ),

                            `<strong>${escapeHtml(
                                announcement.title
                            )}</strong>`,

                            escapeHtml(
                                announcement.message ||
                                    announcement.content ||
                                    announcement.body
                            ),

                            escapeHtml(
                                announcement.audience ||
                                    announcement.target_audience ||
                                    announcement.target_department_name
                            ),

                            escapeHtml(
                                announcement.priority ||
                                    "Normal"
                            ),

                            escapeHtml(
                                announcement.status ||
                                    "Published"
                            )
                        ]
                    )
                )
            )
        );

    /* =========================================================
       CARE FOLLOW-UP REPORT
    ========================================================= */

    const carePrint = () =>
        reportShell(
            "Care Follow-up Report",
            `${monthName} • ${selectedCareFollowups.length} care case(s)`,

            section(
                "Care Follow-ups",

                table(
                    [
                        "Member",
                        "Type",
                        "Status",
                        "Date",
                        "Notes"
                    ],

                    selectedCareFollowups.map(
                        (care) => [
                            escapeHtml(
                                care.member_name ||
                                    `${care.first_name || ""} ${
                                        care.last_name || ""
                                    }`.trim()
                            ),

                            escapeHtml(
                                care.reason ||
                                    care.care_type ||
                                    care.type ||
                                    care.category
                            ),

                            escapeHtml(
                                care.status
                            ),

                            escapeHtml(
                                formatDate(
                                    care.due_date ||
                                        care.follow_up_date ||
                                        care.date ||
                                        care.created_at
                                )
                            ),

                            escapeHtml(
                                care.notes ||
                                    care.description
                            )
                        ]
                    )
                )
            )
        );

    /* =========================================================
       TASK REPORT
    ========================================================= */

    const tasksPrint = () =>
        reportShell(
            "Task Report",
            `${monthName} • ${selectedTasks.length} task(s)`,

            section(
                "Ministry Tasks",

                table(
                    [
                        "Title",
                        "Priority",
                        "Status",
                        "Due Date",
                        "Assigned To"
                    ],

                    selectedTasks.map(
                        (task) => [
                            `<strong>${escapeHtml(
                                task.title
                            )}</strong>`,

                            escapeHtml(
                                task.priority
                            ),

                            escapeHtml(
                                task.status
                            ),

                            escapeHtml(
                                formatDate(
                                    task.due_date
                                )
                            ),

                            escapeHtml(
                                task.assigned_to_name ||
                                    task.assigned_to
                            )
                        ]
                    )
                )
            )
        );

    /* =========================================================
       REPORT BUILDERS
    ========================================================= */

    const reportBuilders = {
        overview: dashboardPrint,
        members: membersPrint,
        attendance: attendancePrint,
        finance: financePrint,
        visitors: visitorsPrint,
        events: eventsPrint,
        announcements: announcementsPrint,
        care: carePrint,
        tasks: tasksPrint
    };

    const printReport = (type) => {
        if (
            type === "finance" &&
            !canViewFinance
        ) {
            return;
        }

        const html =
            reportBuilders[type]();

        openPrintWindow(html, type);
    };

    const printAllReports = () => {
        const reports = [
            dashboardPrint(),
            membersPrint(),
            attendancePrint(),
            ...(canViewFinance
                ? [financePrint()]
                : []),
            visitorsPrint(),
            eventsPrint(),
            announcementsPrint(),
            carePrint(),
            tasksPrint()
        ].join("");

        openPrintWindow(
            reports,
            "all-reports"
        );
    };

    /* =========================================================
       PRINT WINDOW
    ========================================================= */

    const openPrintWindow = (
        content,
        name
    ) => {
        const documentHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Ministry Hub - ${escapeHtml(name)}</title>

                <style>
                    @page {
                        size: A4;
                        margin: 12mm;
                    }

                    * {
                        box-sizing: border-box;
                    }

                    body {
                        margin: 0;
                        font-family: Arial, Helvetica, sans-serif;
                        color: #1f2937;
                        background: #fff;
                        font-size: 10px;
                    }

                    .report-section {
                        position: relative;
                        padding-bottom: 18mm;
                        page-break-after: always;
                    }

                    .report-section:last-child {
                        page-break-after: auto;
                    }

                    .report-title {
                        display: flex;
                        justify-content: space-between;
                        gap: 20px;
                        align-items: flex-start;
                        border-bottom: 3px solid #c9a24d;
                        padding-bottom: 10px;
                        margin-bottom: 14px;
                    }

                    .brand {
                        color: #1e3a5f;
                        font-weight: 800;
                        font-size: 12px;
                        letter-spacing: 1.5px;
                    }

                    h1 {
                        margin: 3px 0 2px;
                        color: #1e3a5f;
                        font-size: 22px;
                    }

                    .report-title p {
                        margin: 0;
                        color: #6b7280;
                        font-size: 10px;
                    }

                    .generated {
                        color: #6b7280;
                        font-size: 8px;
                        text-align: right;
                        white-space: nowrap;
                    }

                    h2 {
                        color: #1e3a5f;
                        font-size: 13px;
                        margin: 0 0 7px;
                    }

                    .subsection {
                        margin: 0 0 14px;
                        break-inside: avoid;
                    }

                    .metric-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 7px;
                        margin-bottom: 14px;
                    }

                    .metric {
                        border: 1px solid #dbe2ea;
                        border-radius: 6px;
                        padding: 8px;
                        background: #f8fafc;
                        min-height: 46px;
                    }

                    .metric span {
                        display: block;
                        color: #6b7280;
                        font-size: 8px;
                        margin-bottom: 4px;
                    }

                    .metric strong {
                        display: block;
                        color: #1e3a5f;
                        font-size: 13px;
                        white-space: nowrap;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 5px;
                    }

                    th {
                        background: #1e3a5f;
                        color: #fff;
                        font-weight: 700;
                        text-align: left;
                        padding: 6px 7px;
                        font-size: 8px;
                    }

                    td {
                        border: 1px solid #dbe2ea;
                        padding: 6px 7px;
                        vertical-align: top;
                        font-size: 8px;
                        line-height: 1.45;
                    }

                    td + td,
                    th + th {
                        border-left-width: 1px;
                    }

                    tr {
                        break-inside: avoid;
                    }

                    tbody tr:nth-child(even) {
                        background: #f8fafc;
                    }

                    .empty {
                        border: 1px dashed #cbd5e1;
                        padding: 14px;
                        color: #6b7280;
                        text-align: center;
                    }

                    .footer {
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        border-top: 1px solid #e5e7eb;
                        padding-top: 6px;
                        color: #6b7280;
                        font-size: 7px;
                    }

                    @media screen {
                        body {
                            padding: 12px;
                            background: #f3f4f6;
                        }

                        .report-section {
                            background: #fff;
                            max-width: 794px;
                            margin: 0 auto 18px;
                            padding: 32px 38px 60px;
                            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
                        }
                    }

                    @media print {
                        body {
                            padding: 0;
                            background: #fff;
                        }

                        .report-section {
                            box-shadow: none;
                            margin: 0;
                        }
                    }
                </style>
            </head>

            <body>
                ${content}
            </body>
            </html>
        `;

        setPreviewTitle(
            `${name === "all-reports" ? "All Reports" : name
                .replace(/-/g, " ")
                .replace(/\b\w/g, (letter) => letter.toUpperCase())} — ${monthName}`
        );
        setPreviewHtml(documentHtml);
    };

    const printPreview = () => {
        const frame = previewFrameRef.current;

        if (!frame?.contentWindow) {
            return;
        }

        frame.contentWindow.focus();
        frame.contentWindow.print();
    };

    /* =========================================================
       PAGE
    ========================================================= */

    return (
        <div className="page page-fade">

            <div className="page-header page-header-row">

                <div>

                    <span className="eyebrow">
                        Reports & Insights
                    </span>

                    <h1>
                        Reports
                    </h1>

                    <p>
                        Reports are generated from
                        the same records used by the
                        Ministry Hub modules.
                    </p>

                </div>

                <div className="toolbar-actions">

                    <button
                        className="secondary-btn"
                        onClick={fetchReports}
                    >
                        <FaSyncAlt />

                        Refresh
                    </button>

                    <button
                        className="primary-btn"
                        onClick={printAllReports}
                    >
                        <FaPrint />

                        Print All Reports
                    </button>

                </div>

            </div>

            {/* =================================================
                REPORT PERIOD
            ================================================= */}

            <div
                className="table-card"
                style={{
                    marginBottom: 20
                }}
            >

                <div className="table-toolbar">

                    <div>

                        <h2>
                            Report Period
                        </h2>

                        <p>
                            The selected period controls
                            time-based reports such as attendance,
                            visitors, contributions, events and
                            announcements. Member reports use the
                            membership population that existed during
                            the selected period.
                        </p>

                    </div>

                    <div
                        className="toolbar-actions"
                        style={{
                            justifyContent: "flex-end",
                            alignItems: "flex-end"
                        }}
                    >
                        <button
                            type="button"
                            className={
                                useCustomRange
                                    ? "secondary-btn"
                                    : "primary-btn"
                            }
                            onClick={() =>
                                setUseCustomRange(false)
                            }
                        >
                            Monthly
                        </button>

                        <button
                            type="button"
                            className={
                                useCustomRange
                                    ? "primary-btn"
                                    : "secondary-btn"
                            }
                            onClick={() =>
                                setUseCustomRange(true)
                            }
                        >
                            Custom Range
                        </button>

                        {!useCustomRange ? (
                            <>
                                <select
                                    value={selectedMonth}
                                    onChange={(event) =>
                                        setSelectedMonth(
                                            Number(event.target.value)
                                        )
                                    }
                                    aria-label="Report month"
                                >
                                    {Array.from(
                                        { length: 12 },
                                        (_, index) => (
                                            <option
                                                key={index + 1}
                                                value={index + 1}
                                            >
                                                {new Date(
                                                    2000,
                                                    index,
                                                    1
                                                ).toLocaleString(
                                                    "en-US",
                                                    { month: "long" }
                                                )}
                                            </option>
                                        )
                                    )}
                                </select>

                                <select
                                    value={selectedYear}
                                    onChange={(event) =>
                                        setSelectedYear(
                                            Number(event.target.value)
                                        )
                                    }
                                    aria-label="Report year"
                                >
                                    {Array.from(
                                        { length: 5 },
                                        (_, index) => {
                                            const year =
                                                today.getFullYear() -
                                                2 +
                                                index;

                                            return (
                                                <option
                                                    key={year}
                                                    value={year}
                                                >
                                                    {year}
                                                </option>
                                            );
                                        }
                                    )}
                                </select>
                            </>
                        ) : (
                            <>
                                <label
                                    style={{
                                        display: "grid",
                                        gap: "5px",
                                        fontSize: "12px",
                                        fontWeight: 700
                                    }}
                                >
                                    From
                                    <input
                                        type="date"
                                        value={customFrom}
                                        max={customTo}
                                        onChange={(event) =>
                                            setCustomFrom(
                                                event.target.value
                                            )
                                        }
                                    />
                                </label>

                                <label
                                    style={{
                                        display: "grid",
                                        gap: "5px",
                                        fontSize: "12px",
                                        fontWeight: 700
                                    }}
                                >
                                    To
                                    <input
                                        type="date"
                                        value={customTo}
                                        min={customFrom}
                                        onChange={(event) =>
                                            setCustomTo(
                                                event.target.value
                                            )
                                        }
                                    />
                                </label>
                            </>
                        )}
                    </div>

                </div>

            </div>

            {error && (
                <div className="page-error">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="loading-box">
                    Loading reports...
                </div>
            ) : (
                <>

                    {/* =================================================
                        STATISTICS
                    ================================================= */}

                    <div className="dashboard-grid">

                        {[
                            [
                                FaUsers,
                                "Total Members",
                                selectedMembers.length
                            ],

                            [
                                FaUsers,
                                "Active Members",
                                selectedMembers.filter(
                                    (member) =>
                                        String(
                                            getMemberStatus(member)
                                        ).trim().toLowerCase() ===
                                        "active"
                                ).length
                            ],

                            [
                                FaUserPlus,
                                "Visitors in Period",
                                selectedVisitors.length
                            ],

                            [
                                FaHandHoldingUsd,
                                "Contributions in Period",
                                formatMoney(
                                    totalContributionAmount
                                )
                            ],

                            [
                                FaHeart,
                                "Pending Care Follow-ups",
                                dashboard?.pending_care_followups ??
                                    selectedCarePending
                            ],

                            [
                                FaTasks,
                                "Pending Tasks",
                                dashboard?.pending_tasks ??
                                    selectedTaskPending
                            ],

                            [
                                FaClipboardCheck,
                                "Missing Members",
                                dashboard?.missing_members ??
                                    0
                            ]
                        ].map(
                            ([
                                Icon,
                                label,
                                value
                            ]) => (
                                <div
                                    className="stat-card"
                                    key={label}
                                >

                                    <div className="stat-icon">
                                        <Icon />
                                    </div>

                                    <h3>
                                        {label}
                                    </h3>

                                    <p>
                                        {value}
                                    </p>

                                </div>
                            )
                        )}

                    </div>

                    {/* =================================================
                        REPORT CARDS
                    ================================================= */}

                    <div className="report-grid">

                        <ReportCard
                            title="Church Health"
                            icon={
                                <FaChartLine />
                            }
                            description="Status across the selected reporting period."
                            onPrint={() =>
                                printReport(
                                    "overview"
                                )
                            }
                        >

                            <div className="report-list">

                                <div>
                                    <span>
                                        Member Status Groups
                                    </span>

                                    <strong>
                                        {
                                            memberStatusRows.length
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Care Cases
                                    </span>

                                    <strong>
                                        {
                                            (
                                                churchHealth?.care_followups ||
                                                []
                                            ).reduce(
                                                (sum, row) =>
                                                    sum + Number(row.total || 0),
                                                0
                                            )
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Task Groups
                                    </span>

                                    <strong>
                                        {
                                            (
                                                churchHealth?.tasks ||
                                                []
                                            ).length
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Visitor Follow-up Groups
                                    </span>

                                    <strong>
                                        {
                                            (
                                                churchHealth?.visitor_followups ||
                                                []
                                            ).length
                                        }
                                    </strong>
                                </div>

                            </div>

                        </ReportCard>

                        <ReportCard
                            title="Member Report"
                            icon={
                                <FaUsers />
                            }
                            description={`${selectedMembers.length} members in the selected period; ${membersWithoutJoinDate.length} without a recorded join date.`}
                            onPrint={() =>
                                printReport(
                                    "members"
                                )
                            }
                        >

                            <div className="report-list">

                                <div>
                                    <span>
                                        Members in Period
                                    </span>

                                    <strong>
                                        {
                                            selectedMembers.length
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Current Active
                                    </span>

                                    <strong>
                                        {
                                            currentActiveMembers
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Current Inactive
                                    </span>

                                    <strong>
                                        {
                                            currentMembers.length -
                                            currentActiveMembers
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Missing Join Date
                                    </span>

                                    <strong>
                                        {
                                            membersWithoutJoinDate.length
                                        }
                                    </strong>
                                </div>

                            </div>

                        </ReportCard>

                        <ReportCard
                            title="Attendance Report"
                            icon={
                                <FaClipboardCheck />
                            }
                            description={`${monthName}`}
                            onPrint={() =>
                                printReport(
                                    "attendance"
                                )
                            }
                        >

                            <div className="report-list">

                                <div>
                                    <span>
                                        Sessions
                                    </span>

                                    <strong>
                                        {
                                            selectedSessions.length
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Present
                                    </span>

                                    <strong>
                                        {
                                            presentCount
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Absent
                                    </span>

                                    <strong>
                                        {
                                            absentCount
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Rate
                                    </span>

                                    <strong>
                                        {
                                            attendanceRate
                                        }%
                                    </strong>
                                </div>

                            </div>

                        </ReportCard>

                        {canViewFinance && (
                            <ReportCard
                                title="Finance Report"
                                icon={
                                    <FaHandHoldingUsd />
                                }
                                description={`${monthName}`}
                                onPrint={() =>
                                    printReport(
                                        "finance"
                                    )
                                }
                            >

                                <div className="report-list">

                                    <div>
                                        <span>
                                            Total Contributions
                                        </span>

                                        <strong>
                                            {formatMoney(
                                                totalContributionAmount
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Records
                                        </span>

                                        <strong>
                                            {
                                                selectedContributions.length
                                            }
                                        </strong>
                                    </div>

                                </div>

                            </ReportCard>
                        )}

                        <ReportCard
                            title="Visitor Report"
                            icon={
                                <FaUserPlus />
                            }
                            description={`${selectedVisitors.length} visitor(s) in the selected period.`}
                            onPrint={() =>
                                printReport(
                                    "visitors"
                                )
                            }
                        >

                            <div className="report-list">

                                <div>
                                    <span>
                                        Visitors This Month
                                    </span>

                                    <strong>
                                        {
                                            selectedVisitors.length
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Follow-up Groups
                                    </span>

                                    <strong>
                                        {
                                            visitorRows.length
                                        }
                                    </strong>
                                </div>

                            </div>

                        </ReportCard>

                        <ReportCard
                            title="Events Report"
                            icon={
                                <FaCalendarAlt />
                            }
                            description={`${selectedEvents.length} event(s) in the selected period.`}
                            onPrint={() =>
                                printReport(
                                    "events"
                                )
                            }
                        >

                            <div className="report-list">

                                {selectedEvents
                                    .slice(0, 3)
                                    .map(
                                        (
                                            event
                                        ) => (
                                            <div
                                                key={
                                                    event.id ||
                                                    event.event_id
                                                }
                                            >

                                                <span>
                                                    {
                                                        event.title ||
                                                        event.name
                                                    }
                                                </span>

                                                <strong>
                                                    {formatDate(
                                                        event.event_date ||
                                                            event.date
                                                    )}
                                                </strong>

                                            </div>
                                        )
                                    )}

                                {!selectedEvents.length && (
                                    <div>

                                        <span>
                                            No upcoming events
                                        </span>

                                        <strong>
                                            0
                                        </strong>

                                    </div>
                                )}

                            </div>

                        </ReportCard>

                        <ReportCard
                            title="Recent Announcements"
                            icon={
                                <FaBullhorn />
                            }
                            description={`${selectedAnnouncements.length} announcement(s).`}
                            onPrint={() =>
                                printReport(
                                    "announcements"
                                )
                            }
                        >

                            <div className="report-list">

                                {selectedAnnouncements
                                    .slice(0, 3)
                                    .map(
                                        (
                                            announcement
                                        ) => (
                                            <div
                                                key={
                                                    announcement.id ||
                                                    announcement.announcement_id
                                                }
                                            >

                                                <span>
                                                    {
                                                        announcement.title
                                                    }
                                                </span>

                                                <strong>
                                                    {formatDate(
                                                        announcement.announcement_date ||
                                                            announcement.created_at
                                                    )}
                                                </strong>

                                            </div>
                                        )
                                    )}

                                {!selectedAnnouncements.length && (
                                    <div>

                                        <span>
                                            No announcements
                                        </span>

                                        <strong>
                                            0
                                        </strong>

                                    </div>
                                )}

                            </div>

                        </ReportCard>

                        <ReportCard
                            title="Care Follow-ups"
                            icon={
                                <FaHeart />
                            }
                            description={`${selectedCareFollowups.length} care case(s) in the selected period.`}
                            onPrint={() =>
                                printReport(
                                    "care"
                                )
                            }
                        >

                            <div className="report-list">

                                <div>
                                    <span>
                                        Total Cases
                                    </span>

                                    <strong>
                                        {
                                            selectedCareFollowups.length
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Pending / In Progress
                                    </span>

                                    <strong>
                                        {
                                            selectedCarePending
                                        }
                                    </strong>
                                </div>

                            </div>

                        </ReportCard>

                        <ReportCard
                            title="Tasks"
                            icon={
                                <FaTasks />
                            }
                            description={`${selectedTasks.length} ministry task(s) in the selected period.`}
                            onPrint={() =>
                                printReport(
                                    "tasks"
                                )
                            }
                        >

                            <div className="report-list">

                                <div>
                                    <span>
                                        Total Tasks
                                    </span>

                                    <strong>
                                        {
                                            selectedTasks.length
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Pending / In Progress
                                    </span>

                                    <strong>
                                        {
                                            selectedTaskPending
                                        }
                                    </strong>
                                </div>

                            </div>

                        </ReportCard>

                    </div>

                </>
            )}

            {previewHtml && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Report preview"
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 9999,
                        background: "rgba(15, 23, 42, 0.72)",
                        display: "flex",
                        flexDirection: "column",
                        padding: "20px"
                    }}
                >
                    <div
                        style={{
                            background: "#ffffff",
                            borderRadius: "12px",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                            width: "100%",
                            height: "100%",
                            maxWidth: "1200px",
                            margin: "0 auto",
                            boxShadow: "0 20px 60px rgba(0,0,0,0.25)"
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "16px",
                                padding: "14px 18px",
                                borderBottom: "1px solid #e5e7eb"
                            }}
                        >
                            <div>
                                <strong
                                    style={{
                                        display: "block",
                                        color: "#1e3a5f",
                                        fontSize: "16px"
                                    }}
                                >
                                    Report Preview
                                </strong>
                                <span
                                    style={{
                                        color: "#6b7280",
                                        fontSize: "12px"
                                    }}
                                >
                                    {previewTitle}
                                </span>
                            </div>

                            <div
                                className="toolbar-actions"
                                style={{
                                    display: "flex",
                                    gap: "8px"
                                }}
                            >
                                <button
                                    className="secondary-btn"
                                    onClick={() =>
                                        setPreviewHtml("")
                                    }
                                >
                                    Close
                                </button>

                                <button
                                    className="primary-btn"
                                    onClick={printPreview}
                                >
                                    <FaPrint />
                                    Print
                                </button>
                            </div>
                        </div>

                        <iframe
                            ref={previewFrameRef}
                            title="Report preview"
                            srcDoc={previewHtml}
                            style={{
                                border: 0,
                                width: "100%",
                                flex: 1,
                                background: "#f3f4f6"
                            }}
                        />
                    </div>
                </div>
            )}

        </div>
    );
};

/* =============================================================
   REPORT CARD COMPONENT
============================================================= */

const ReportCard = ({
    title,
    icon,
    description,
    onPrint,
    children
}) => (
    <div className="table-card">

        <div className="section-header">

            <div>

                <h2>
                    {icon} {title}
                </h2>

                <p>
                    {description}
                </p>

            </div>

            <button
                className="secondary-btn"
                onClick={onPrint}
            >
                <FaPrint />

                Print Report
            </button>

        </div>

        {children}

    </div>
);

export default Reports;