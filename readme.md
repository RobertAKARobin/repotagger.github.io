# RepoTagger

I got tired of digging through all my repos to see which were Ruby, which were Javascript, and so on. So I made this janky system of tagging repos, and sorting them by those tags (as well as the repo names and number of stars).

Go to http://repotagger.github.io, enter the name of a Github organization or user, click "Load Repos", and away you go. Bookmark the resulting link for easy access, or fork this and add it to your own organization/account.

This uses the Github API. They have *rate limiting* in place -- you can only use their API so much with one Github account before they start rejecting you -- so RepoTagger asks each user to log into their own Github account first.

## To tag repos

Edit the "Description" of the repo on Github, and include your tags `[in,this,format]`.

For example:

```
[ruby,activerecord] This is my sweet app.
```

## TODO

- ~~Enable API caching to mitigate bumping against the rate limit~~ (Done!)
- Sort by multiple tags
- Figure out why the Github API always returns the same values for `watchers_count` and `stargazers_count`
