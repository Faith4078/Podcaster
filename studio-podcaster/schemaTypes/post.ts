import {defineArrayMember, defineField, defineType} from 'sanity'

// A blog post for the Podcaster site. The app reads these through the public
// Sanity API (see src/lib/blog.ts) and falls back to its built in launch posts
// when none are published yet.
export const post = defineType({
  name: 'post',
  title: 'Blog post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      description: 'One or two sentences shown on the blog list and in search results.',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required().max(300),
    }),
    defineField({
      name: 'category',
      type: 'string',
      options: {
        list: ['Getting started', 'Craft', 'Distribution', 'Growth', 'Branding'],
      },
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative text',
          type: 'string',
          description: 'Describe the image for screen readers.',
        }),
      ],
    }),
    defineField({
      name: 'imagePrompt',
      title: 'Image prompt',
      description:
        'Prompt for an image agent to generate this post’s main image. Not shown on the site.',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'body',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'Heading', value: 'h2'},
            {title: 'Subheading', value: 'h3'},
            {title: 'Quote', value: 'blockquote'},
          ],
          lists: [{title: 'Bullet', value: 'bullet'}],
          // The site renders plain text, so no bold, italic or links.
          marks: {decorators: [], annotations: []},
        }),
      ],
      validation: (rule) => rule.required(),
    }),
  ],
  orderings: [
    {
      title: 'Newest first',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {title: 'title', subtitle: 'category', media: 'mainImage'},
  },
})
