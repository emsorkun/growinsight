'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Star, MapPin } from 'lucide-react';
import { getCuisineIcon, type MissingBrand } from '@/types';

export default function MissingBrandsPage() {
  const [data, setData] = useState<MissingBrand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMissingBrands = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/missing-brands');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Set mock data for demo
      setData(getMockMissingBrands());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMissingBrands();
  }, [fetchMissingBrands]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.cuisine.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${
              i < fullStars
                ? 'fill-yellow-400 text-yellow-400'
                : i === fullStars && hasHalfStar
                  ? 'fill-yellow-400/50 text-yellow-400'
                  : 'fill-muted text-muted'
            }`}
          />
        ))}
        <span className="ml-1 text-xs text-muted-foreground">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      <Header
        title="Missing Brands in Careem"
        subtitle="Brands available on Talabat but not on Careem across all areas and cuisines"
      />

      <div className="flex-1 space-y-6 p-4 lg:p-6">
        {error && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            Note: Using demo data. {error}
          </div>
        )}

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg font-semibold">All Missing Brands</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search brands, cuisine, or area..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                No missing brands found.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredData.map((brand) => (
                  <div
                    key={brand.id}
                    className="group relative rounded-lg border bg-card p-4 transition-all duration-200 hover:shadow-lg hover:border-primary/20"
                  >
                    {brand.locationCount > 1 && (
                      <Badge
                        variant="secondary"
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full p-0 text-xs font-semibold"
                      >
                        {brand.locationCount}
                      </Badge>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getCuisineIcon(brand.cuisine)}</span>
                          <div>
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {brand.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">{brand.cuisine}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{brand.location}</span>
                      </div>

                      {renderStars(brand.rating)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getMockMissingBrands(): MissingBrand[] {
  const brands = [
    { name: "Hardee's", cuisine: 'American', location: 'Al Barsha' },
    { name: 'Texas Chicken', cuisine: 'American', location: 'Downtown Dubai' },
    { name: 'Papa Johns', cuisine: 'Italian', location: 'JBR' },
    { name: 'Pizza Express', cuisine: 'Italian', location: 'Marina' },
    { name: 'Chopstix', cuisine: 'Asian', location: 'Business Bay' },
    { name: 'Wagamama', cuisine: 'Asian', location: 'DIFC' },
    { name: 'Biryani House', cuisine: 'Indian', location: 'Deira' },
    { name: 'Saffron Lounge', cuisine: 'Indian', location: 'Bur Dubai' },
    { name: 'Zaroob', cuisine: 'Middle Eastern', location: 'Al Quoz' },
    { name: 'Operation Falafel', cuisine: 'Middle Eastern', location: 'Silicon Oasis' },
    { name: 'Taco Bell', cuisine: 'Mexican', location: 'Sports City' },
    { name: 'Chipotle', cuisine: 'Mexican', location: 'Motor City' },
    { name: 'The Coffee Club', cuisine: 'Beverages', location: 'Arabian Ranches' },
    { name: 'Starbucks Reserve', cuisine: 'Beverages', location: 'Palm Jumeirah' },
    { name: 'Krispy Kreme', cuisine: 'Desserts', location: 'Discovery Gardens' },
    { name: 'Baskin Robbins', cuisine: 'Desserts', location: 'Jumeirah' },
    { name: 'Sultan Delight', cuisine: 'Turkish', location: 'Sharjah Central' },
    { name: 'Mangal Ocakbasi', cuisine: 'Turkish', location: 'Al Nahda Sharjah' },
    { name: 'The Raw Place', cuisine: 'Healthy', location: 'Al Khan' },
    { name: 'Kcal', cuisine: 'Healthy', location: 'Ajman Downtown' },
    { name: 'Fishmarket', cuisine: 'Seafood', location: 'Al Barsha' },
    { name: 'Bu Qtair', cuisine: 'Seafood', location: 'Jumeirah' },
    { name: 'Al Baik', cuisine: 'Fast Food', location: 'Multiple Locations' },
    { name: 'Shawarma Queen', cuisine: 'Shawarma', location: 'Deira' },
  ];

  return brands.map((brand, index) => ({
    id: `brand-${index}`,
    name: brand.name,
    cuisine: brand.cuisine,
    location: brand.location,
    rating: 3.5 + Math.random() * 1.5,
    locationCount: Math.floor(Math.random() * 5) + 1,
  }));
}
