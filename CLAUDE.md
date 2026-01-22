# Project Guidelines

## Startup Mindset
Move fast and ship. Iterate based on real usage, not hypothetical requirements.

1. Breaking changes are acceptable - backward compatibility is not a concern for this pre-release
2. Test assertions should compare entire objects using `.toEqual()` rather than checking individual properties
3. Keep code simple and focused - rely on tests to catch issues rather than adding excessive validation or error handling
4. Keep it simple, silly - write lean, straightforward code without unnecessary abstractions or complexity
