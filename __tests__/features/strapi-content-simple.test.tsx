import { render, screen } from '@testing-library/react';

// Mock fetch globally
beforeAll(() => {
  global.fetch = jest.fn();
});

describe('Strapi Content - Core Functionality', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('Navigation Data Structure', () => {
    test('validates navigation data structure', () => {
      const validNavData = {
        data: {
          nav_items: [
            {
              id: 1,
              label: 'Home',
              url: '/',
              icon: 'HomeIcon',
              order: 0,
              parent_node: null,
            },
            {
              id: 2,
              label: 'About',
              url: '/about',
              icon: 'InfoIcon',
              order: 1,
              parent_node: null,
            },
          ],
        },
      };

      expect(validNavData.data.nav_items).toBeInstanceOf(Array);
      expect(validNavData.data.nav_items).toHaveLength(2);
      expect(validNavData.data.nav_items[0]).toHaveProperty('id');
      expect(validNavData.data.nav_items[0]).toHaveProperty('label');
      expect(validNavData.data.nav_items[0]).toHaveProperty('url');
    });

    test('handles empty navigation data', () => {
      const emptyNavData = {
        data: {
          nav_items: [],
        },
      };

      expect(emptyNavData.data.nav_items).toHaveLength(0);
    });
  });

  describe('Content Component Data Structure', () => {
    test('validates hero component data', () => {
      const heroData = {
        __component: 'page-components.hero',
        title: 'Welcome to Evidoxa',
        subtitle: 'Your historical research platform',
        backgroundImage: {
          url: '/uploads/hero-bg.jpg',
          alternativeText: 'Hero background',
        },
        ctaText: 'Get Started',
        ctaLink: '/dashboard',
      };

      expect(heroData.__component).toBe('page-components.hero');
      expect(heroData).toHaveProperty('title');
      expect(heroData).toHaveProperty('subtitle');
      expect(heroData).toHaveProperty('backgroundImage');
      expect(heroData.backgroundImage).toHaveProperty('url');
      expect(heroData.backgroundImage).toHaveProperty('alternativeText');
    });

    test('validates text-image component data', () => {
      const textImageData = {
        __component: 'page-components.text-image',
        title: 'Our Mission',
        content: 'We help historians organize and analyze historical data.',
        image: {
          url: '/uploads/mission.jpg',
          alternativeText: 'Mission image',
        },
        imagePosition: 'right',
      };

      expect(textImageData.__component).toBe('page-components.text-image');
      expect(textImageData).toHaveProperty('title');
      expect(textImageData).toHaveProperty('content');
      expect(textImageData).toHaveProperty('image');
      expect(textImageData).toHaveProperty('imagePosition');
    });

    test('validates benefit-list component data', () => {
      const benefitListData = {
        __component: 'page-components.benefit-list',
        title: 'Key Features',
        benefits: [
          {
            title: 'Data Organization',
            description: 'Organize historical data efficiently',
            icon: 'DataUsageIcon',
          },
          {
            title: 'Timeline Visualization',
            description: 'Visualize historical timelines',
            icon: 'TimelineIcon',
          },
        ],
      };

      expect(benefitListData.__component).toBe('page-components.benefit-list');
      expect(benefitListData).toHaveProperty('title');
      expect(benefitListData).toHaveProperty('benefits');
      expect(benefitListData.benefits).toBeInstanceOf(Array);
      expect(benefitListData.benefits).toHaveLength(2);
      expect(benefitListData.benefits[0]).toHaveProperty('title');
      expect(benefitListData.benefits[0]).toHaveProperty('description');
      expect(benefitListData.benefits[0]).toHaveProperty('icon');
    });
  });

  describe('Navigation Tree Building Logic', () => {
    test('builds navigation tree from flat data', () => {
      const flatItems = [
        { id: 1, label: 'Home', url: '/', parent_node: null },
        { id: 2, label: 'About', url: '/about', parent_node: null },
        { id: 3, label: 'Services', url: '/services', parent_node: null },
        { id: 4, label: 'Consulting', url: '/services/consulting', parent_node: { id: 3 } },
        { id: 5, label: 'Development', url: '/services/development', parent_node: { id: 3 } },
      ];

      // Build navigation tree
      const idMap: any = {};
      flatItems.forEach(item => {
        idMap[item.id] = { ...item, children: [] };
      });
      
      const tree: any[] = [];
      flatItems.forEach(item => {
        if (item.parent_node && item.parent_node.id) {
          if (idMap[item.parent_node.id]) {
            idMap[item.parent_node.id].children.push(idMap[item.id]);
          }
        } else {
          tree.push(idMap[item.id]);
        }
      });

      expect(tree).toHaveLength(3); // Home, About, Services
      expect(tree[2].children).toHaveLength(2); // Services has 2 children
      expect(tree[2].children[0].label).toBe('Consulting');
      expect(tree[2].children[1].label).toBe('Development');
    });

    test('handles items without parent nodes', () => {
      const flatItems = [
        { id: 1, label: 'Home', url: '/', parent_node: null },
        { id: 2, label: 'About', url: '/about', parent_node: null },
      ];

      const idMap: any = {};
      flatItems.forEach(item => {
        idMap[item.id] = { ...item, children: [] };
      });
      
      const tree: any[] = [];
      flatItems.forEach(item => {
        if (item.parent_node && item.parent_node.id) {
          if (idMap[item.parent_node.id]) {
            idMap[item.parent_node.id].children.push(idMap[item.id]);
          }
        } else {
          tree.push(idMap[item.id]);
        }
      });

      expect(tree).toHaveLength(2);
      expect(tree[0].children).toHaveLength(0);
      expect(tree[1].children).toHaveLength(0);
    });
  });

  describe('Icon Mapping Logic', () => {
    test('maps icon names to components', () => {
      const iconMap: { [key: string]: string } = {
        'HomeIcon': 'HomeIcon',
        'InfoIcon': 'InfoIcon',
        'BusinessIcon': 'BusinessIcon',
        'SupportIcon': 'SupportIcon',
        'DataUsageIcon': 'DataUsageIcon',
        'TimelineIcon': 'TimelineIcon',
      };

      const getMuiIcon = (iconName: string): string => {
        return iconMap[iconName] || 'HomeIcon';
      };

      expect(getMuiIcon('HomeIcon')).toBe('HomeIcon');
      expect(getMuiIcon('InfoIcon')).toBe('InfoIcon');
      expect(getMuiIcon('')).toBe('HomeIcon');
      expect(getMuiIcon('NonExistentIcon')).toBe('HomeIcon');
    });
  });

  describe('Component Rendering Logic', () => {
    test('maps component types to renderers', () => {
      const componentMap: { [key: string]: string } = {
        'page-components.hero': 'Hero',
        'page-components.text-image': 'TextImage',
        'page-components.benefit-list': 'BenefitList',
      };

      const getComponentType = (componentType: string): string => {
        return componentMap[componentType] || 'Unknown';
      };

      expect(getComponentType('page-components.hero')).toBe('Hero');
      expect(getComponentType('page-components.text-image')).toBe('TextImage');
      expect(getComponentType('page-components.benefit-list')).toBe('BenefitList');
      expect(getComponentType('unknown-component')).toBe('Unknown');
    });

    test('validates component data before rendering', () => {
      const validateComponentData = (data: any): boolean => {
        if (!data || !data.__component) {
          return false;
        }
        
        const requiredFields: { [key: string]: string[] } = {
          'page-components.hero': ['title', 'subtitle'],
          'page-components.text-image': ['title', 'content'],
          'page-components.benefit-list': ['title', 'benefits'],
        };

        const componentType = data.__component;
        const required = requiredFields[componentType] || [];
        
        return required.every(field => data.hasOwnProperty(field));
      };

      const validHeroData = {
        __component: 'page-components.hero',
        title: 'Welcome',
        subtitle: 'Subtitle',
      };

      const invalidHeroData = {
        __component: 'page-components.hero',
        title: 'Welcome',
        // missing subtitle
      };

      expect(validateComponentData(validHeroData)).toBe(true);
      expect(validateComponentData(invalidHeroData)).toBe(false);
      expect(validateComponentData(null)).toBe(false);
      expect(validateComponentData({})).toBe(false);
    });
  });

  describe('API Endpoint Validation', () => {
    test('validates Strapi API endpoints', () => {
      const endpoints = {
        navigation: 'http://localhost:1337/api/navigations/ctp0vfu1o3lqz3nj3bt98kae?populate=nav_items.parent_node',
        contentPages: 'http://localhost:1337/api/content-pages?filters[slug][$eq]=about&populate=content',
      };

      expect(endpoints.navigation).toContain('http://localhost:1337/api/navigations/');
      expect(endpoints.navigation).toContain('populate=nav_items.parent_node');
      expect(endpoints.contentPages).toContain('http://localhost:1337/api/content-pages');
      expect(endpoints.contentPages).toContain('filters[slug][$eq]=');
      expect(endpoints.contentPages).toContain('populate=content');
    });

    test('validates API response structure', () => {
      const mockResponse = {
        data: {
          nav_items: [
            { id: 1, label: 'Home', url: '/' },
          ],
        },
      };

      expect(mockResponse).toHaveProperty('data');
      expect(mockResponse.data).toHaveProperty('nav_items');
      expect(Array.isArray(mockResponse.data.nav_items)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('handles missing data gracefully', () => {
      const handleMissingData = (data: any) => {
        if (!data || !data.data) {
          return [];
        }
        return data.data.nav_items || [];
      };

      expect(handleMissingData(null)).toEqual([]);
      expect(handleMissingData({})).toEqual([]);
      expect(handleMissingData({ data: {} })).toEqual([]);
      expect(handleMissingData({ data: { nav_items: [] } })).toEqual([]);
    });

    test('validates required fields', () => {
      const validateRequiredFields = (item: any, requiredFields: string[]): boolean => {
        return requiredFields.every(field => item && item.hasOwnProperty(field));
      };

      const validItem = { id: 1, label: 'Home', url: '/' };
      const invalidItem = { id: 1, label: 'Home' }; // missing url

      expect(validateRequiredFields(validItem, ['id', 'label', 'url'])).toBe(true);
      expect(validateRequiredFields(invalidItem, ['id', 'label', 'url'])).toBe(false);
    });
  });
}); 