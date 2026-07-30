-- Enforce the Like polymorphism invariant at the DB level: a like must target
-- exactly one of (post, watchlist entry). The two per-target unique indexes
-- cannot express this because Postgres treats NULLs as distinct.
-- (Separate migration so it also applies to databases where the social_layer
-- migration has already run.)
ALTER TABLE "likes" ADD CONSTRAINT "likes_exactly_one_target" CHECK (num_nonnulls("postId", "watchlistEntryId") = 1);
