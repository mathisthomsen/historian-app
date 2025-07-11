import type { Schema, Struct } from '@strapi/strapi';

export interface NavigationItemsNavigationItem extends Struct.ComponentSchema {
  collectionName: 'components_navigation_items_navigation_items';
  info: {
    displayName: 'navigation-item';
  };
  attributes: {
    label: Schema.Attribute.String;
    order: Schema.Attribute.Integer;
    page: Schema.Attribute.Relation<
      'oneToOne',
      'api::content-page.content-page'
    >;
    parent: Schema.Attribute.String;
    url: Schema.Attribute.String;
  };
}

export interface PageComponentsBenefit extends Struct.ComponentSchema {
  collectionName: 'components_page_components_benefits';
  info: {
    displayName: 'Benefit';
    icon: 'crown';
  };
  attributes: {
    Copy: Schema.Attribute.Text;
    Image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    Title: Schema.Attribute.String;
  };
}

export interface PageComponentsBenefitList extends Struct.ComponentSchema {
  collectionName: 'components_page_components_benefit_lists';
  info: {
    displayName: 'BenefitList';
    icon: 'bulletList';
  };
  attributes: {
    Benefit: Schema.Attribute.Component<'page-components.benefit', true>;
    Title: Schema.Attribute.String;
  };
}

export interface PageComponentsCard extends Struct.ComponentSchema {
  collectionName: 'components_page_components_cards';
  info: {
    displayName: 'Card';
    icon: 'archive';
  };
  attributes: {
    ButtonLabel: Schema.Attribute.String;
    content_page: Schema.Attribute.Relation<
      'oneToOne',
      'api::content-page.content-page'
    >;
    Copy: Schema.Attribute.Blocks;
    Image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    Subtitle: Schema.Attribute.String;
    Title: Schema.Attribute.String;
  };
}

export interface PageComponentsCardList extends Struct.ComponentSchema {
  collectionName: 'components_page_components_card_lists';
  info: {
    displayName: 'CardList';
    icon: 'bulletList';
  };
  attributes: {
    Card: Schema.Attribute.Component<'page-components.card', true>;
    Title: Schema.Attribute.String;
  };
}

export interface PageComponentsHero extends Struct.ComponentSchema {
  collectionName: 'components_page_components_heroes';
  info: {
    displayName: 'hero';
    icon: 'alien';
  };
  attributes: {
    ButtonLabel: Schema.Attribute.String;
    Copy: Schema.Attribute.Blocks;
    Image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    Title: Schema.Attribute.String;
  };
}

export interface PageComponentsTextImage extends Struct.ComponentSchema {
  collectionName: 'components_page_components_text_images';
  info: {
    displayName: 'Text_Image';
    icon: 'feather';
  };
  attributes: {
    Copy: Schema.Attribute.Blocks;
    Image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    ImagePlaccement: Schema.Attribute.Enumeration<['left', 'right']>;
    Title: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'navigation-items.navigation-item': NavigationItemsNavigationItem;
      'page-components.benefit': PageComponentsBenefit;
      'page-components.benefit-list': PageComponentsBenefitList;
      'page-components.card': PageComponentsCard;
      'page-components.card-list': PageComponentsCardList;
      'page-components.hero': PageComponentsHero;
      'page-components.text-image': PageComponentsTextImage;
    }
  }
}
