-- v41: new role for admin-invited iOS friends, who get into Project 2 (PRIVATE_MODE)
-- like SPECIAL_USER, but deliberately get NO "Koleksi Admin" bypass — every
-- SPECIAL_USER-only check stays untouched, so IOS_USER falls through to the same
-- rules as a plain USER there.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'IOS_USER';
