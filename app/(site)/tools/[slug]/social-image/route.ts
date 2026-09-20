import { renderToolSocialImage } from '@/components/seo/tool-social-image';
import { PRIORITY_TOOL_SOCIAL_IMAGES } from '@/lib/seo/tool-social-images';

type Params = { slug: string };

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> },
): Promise<Response> {
  const { slug } = await params;

  if (!PRIORITY_TOOL_SOCIAL_IMAGES[slug]) {
    return new Response('Not found', { status: 404 });
  }

  return renderToolSocialImage(slug);
}
