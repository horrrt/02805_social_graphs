// Gives a component test a jsdom document and unmounts what it rendered after
// each test. Import it first in every tests/components/*.test.tsx: Testing
// Library binds `screen` to document.body when it loads, and it cleans up on
// its own only under runners with a global afterEach, which node:test lacks.
import "global-jsdom/register";
import { afterEach } from "node:test";
import { cleanup } from "@testing-library/react";

afterEach(cleanup);
