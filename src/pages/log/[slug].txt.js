import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

export async function GET({ props }) {
  const { post } = props;
  const date = post.data.date.toISOString().slice(0, 10);
  const rule = '-'.repeat(Math.max(post.data.title.length, date.length));
  const body = [
    post.data.title,
    date,
    `https://tinksoft.com/log/${post.id}/`,
    rule,
    '',
    (post.body ?? '').trim(),
    '',
  ].join('\n');
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
