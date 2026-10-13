import { PostTopbar } from "log-log-legends-kit";

// Week 5's bar: the brand on the left, the site nav (Home, Posts, About) on
// the right, with Week 5 marked current in the Posts menu.
export const Week5 = () => <PostTopbar root="../../" current="weeks/week05/" />;

// The home page marks Home.
export const Home = () => <PostTopbar root="./" current="home" />;

// The post template's bar: no post is current.
export const Template = () => <PostTopbar root="../../" />;
