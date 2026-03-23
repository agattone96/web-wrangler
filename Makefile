.PHONY: install dev lint test typecheck build verify pack dist clean release-check

install:
	npm install

dev:
	npm run dev

lint:
	npm run lint

test:
	npm test

typecheck:
	npm run typecheck

build:
	npm run build

verify:
	npm run verify

pack:
	npm run pack

dist:
	npm run dist

clean:
	npm run clean

release-check:
	npm run release:check
