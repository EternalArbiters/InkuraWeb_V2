# Perf Refactor Stage 09 - DB tuning baseline

This stage adds code-and-schema level groundwork for database tuning before production EXPLAIN work:

- add targeted composite indexes for feed, reader, review, library, and list access paths
- reuse smaller Prisma `select` presets in viewer library / public reading list flows
- dedupe viewer interaction work ids on home before fetching likes/bookmarks

## Added indexes

### Work
- `(status, type, updatedAt)` for type-filtered newest feeds
- `(status, type, likeCount)` for type-filtered trending feeds
- `(status, publishType, updatedAt)` for publish-type discovery rails
- `(status, publishType, likeCount)` for publish-type trending variants
- `(status, ratingAvg, ratingCount, updatedAt)` for rated/top ordering

### Chapter
- `(workId, status, number, createdAt)` for chapter list / reader navigation
- `(status, publishedAt)` for recent published chapter lookups

### Viewer library
- `WorkLike(userId, createdAt)`
- `Bookmark(userId, createdAt)`
- `ReadingProgress(userId, updatedAt)`
- `ReadingProgress(userId, lastReadAt)`

### Reviews / lists / media
- `Review(workId, rating, createdAt)` for top/bottom review sorting
- `ReadingList(ownerId, isPublic, updatedAt)`
- `ReadingListItem(listId, addedAt)`
- `MediaObject(contentType, createdAt)`

## Notes

These indexes are intentionally based on current query shapes in the repo. They are a safe pre-production pass, not a substitute for production slow-query analysis and `EXPLAIN ANALYZE`.
