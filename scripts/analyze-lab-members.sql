-- ================================================================================
-- LAB MEMBER ANALYSIS & CLEANUP SCRIPT
-- This script helps identify and remove fake/test lab members
-- ================================================================================

-- 1. VIEW ALL LAB MEMBERS WITH HUMAN-READABLE INFORMATION
-- Shows each lab member with their user details and lab information
SELECT 
    lm.id as "Member ID",
    u.name as "User Name",
    u.email as "Email",
    u.role as "Role",
    l."shortName" as "Lab Code",
    l.name as "Lab Name",
    CASE 
        WHEN lm."isAdmin" = true THEN '👑 Admin'
        ELSE '👤 Member'
    END as "Access Level",
    CASE 
        WHEN lm."isActive" = true THEN '✅ Active'
        ELSE '❌ Inactive'
    END as "Status",
    lm."joinedAt"::date as "Joined Date",
    CASE
        WHEN u.email LIKE '%test%' OR u.email LIKE '%demo%' OR u.email LIKE '%example%' THEN '⚠️ TEST EMAIL'
        WHEN u.name LIKE '%Test%' OR u.name LIKE '%Demo%' THEN '⚠️ TEST NAME'
        WHEN l."shortName" = 'TRL' THEN '⚠️ TEST LAB'
        ELSE '✅ OK'
    END as "Suspicious?"
FROM "LabMember" lm
JOIN "User" u ON lm."userId" = u.id
JOIN "Lab" l ON lm."labId" = l.id
ORDER BY l."shortName", u.name;

-- ================================================================================
-- 2. IDENTIFY SUSPICIOUS LAB MEMBERS (potential test/fake data)
-- ================================================================================
SELECT 
    '❌ SUSPICIOUS' as "Status",
    lm.id as "Member ID to Delete",
    u.name as "User",
    u.email as "Email",
    l."shortName" as "Lab",
    ARRAY_TO_STRING(
        ARRAY[
            CASE WHEN u.email LIKE '%test%' THEN 'test email' END,
            CASE WHEN u.email LIKE '%demo%' THEN 'demo email' END,
            CASE WHEN u.email LIKE '%example%' THEN 'example email' END,
            CASE WHEN u.name LIKE '%Test%' THEN 'test name' END,
            CASE WHEN u.name LIKE '%Demo%' THEN 'demo name' END,
            CASE WHEN l."shortName" = 'TRL' THEN 'test lab' END,
            CASE WHEN u."isActive" = false THEN 'inactive user' END
        ],
        ', ',
        ''
    ) as "Reasons"
FROM "LabMember" lm
JOIN "User" u ON lm."userId" = u.id
JOIN "Lab" l ON lm."labId" = l.id
WHERE 
    u.email LIKE '%test%' OR
    u.email LIKE '%demo%' OR
    u.email LIKE '%example%' OR
    u.name LIKE '%Test%' OR
    u.name LIKE '%Demo%' OR
    l."shortName" = 'TRL' OR
    u."isActive" = false;

-- ================================================================================
-- 3. STATISTICS BY LAB
-- ================================================================================
SELECT 
    l."shortName" as "Lab Code",
    l.name as "Lab Name",
    COUNT(lm.id) as "Total Members",
    SUM(CASE WHEN lm."isAdmin" = true THEN 1 ELSE 0 END) as "Admins",
    SUM(CASE WHEN lm."isActive" = true THEN 1 ELSE 0 END) as "Active Members",
    SUM(CASE WHEN lm."isActive" = false THEN 1 ELSE 0 END) as "Inactive Members"
FROM "Lab" l
LEFT JOIN "LabMember" lm ON l.id = lm."labId"
GROUP BY l.id, l."shortName", l.name
ORDER BY l."shortName";

-- ================================================================================
-- 4. MEMBERS IN TEST LAB (TRL) - SHOULD BE DELETED
-- ================================================================================
SELECT 
    lm.id as "LabMember ID",
    u.id as "User ID",
    u.name as "User Name",
    u.email as "Email",
    'DELETE FROM "LabMember" WHERE id = ''' || lm.id || ''';' as "SQL to Delete"
FROM "LabMember" lm
JOIN "User" u ON lm."userId" = u.id
JOIN "Lab" l ON lm."labId" = l.id
WHERE l."shortName" = 'TRL';

-- ================================================================================
-- 5. CLEANUP COMMANDS (UNCOMMENT TO RUN)
-- ================================================================================

-- Remove all members from TRL lab (if it exists)
-- DELETE FROM "LabMember" WHERE "labId" IN (SELECT id FROM "Lab" WHERE "shortName" = 'TRL');

-- Remove test user from all labs
-- DELETE FROM "LabMember" WHERE "userId" IN (SELECT id FROM "User" WHERE email = 'test@example.com');

-- Remove inactive lab memberships
-- DELETE FROM "LabMember" WHERE "isActive" = false;

-- Remove lab members for users with test emails
-- DELETE FROM "LabMember" WHERE "userId" IN (
--     SELECT id FROM "User" 
--     WHERE email LIKE '%test%' 
--        OR email LIKE '%demo%' 
--        OR email LIKE '%example%'
-- );

-- ================================================================================
-- 6. VERIFY CLEANUP RESULTS
-- ================================================================================
SELECT 
    'After cleanup:' as "Status",
    COUNT(*) as "Total Lab Members",
    COUNT(DISTINCT "labId") as "Unique Labs",
    COUNT(DISTINCT "userId") as "Unique Users"
FROM "LabMember";