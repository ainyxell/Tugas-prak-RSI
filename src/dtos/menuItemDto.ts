export interface MenuItemDto {
  id: number;
  stallId: number;
  name: string;
  price: number;
  isAvailable: boolean;
  stallName?: string | null;
}
