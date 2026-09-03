# Surveyor Android — Mobil Arayüz Tasarım Planı

## Ürün yaklaşımı

Surveyor Android, arazide tek elle kullanılmak üzere tasarlanmış, API anahtarı gerektirmeyen OpenStreetMap tabanlı harita üzerinde polygon üzerinden ölçüm/grid noktaları üreten ve Copernicus DEM ile her noktaya Z yüksekliği atayan bir saha uygulamasıdır. Varsayılan çalışma modeli yereldir; kullanıcı hesabı veya bulut depolama gerektirmez. Ana deneyim, harita üzerinde alan seçmekten başlayıp grid üretme, Z dağılımını kontrol etme ve DAT/CSV dosyasını Android paylaşım menüsüyle göndermeye dayanır.

## Ekran listesi

| Ekran | Birincil içerik ve işlev |
|---|---|
| **Proje Ana Sayfası** | Son proje özeti, seçili polygon köşe sayısı, grid nokta sayısı, Z min/max özeti ve “Yeni ölçüm” ana eylemi. |
| **Harita / Alan Seçimi** | API anahtarı gerektirmeyen OpenStreetMap tabanlı harita, polygon köşeleri, kapatma/geri alma düğmeleri, mevcut konum göstergesi ve “Alanı tamamla” eylemi. Harita ekranı başparmak erişiminde alt eylem alanı kullanır. |
| **Grid Ayarları** | Hat aralığı, nokta aralığı, açı, serpentine ve yükseklik modu seçimleri. Ayarlar bölümlere ayrılmış akordeon kartlar şeklindedir. |
| **Copernicus DEM Durumu** | İndirilen/önbelleğe alınan karo durumu, ağ gereksinimi, örnekleme ilerlemesi, hata mesajı ve yeniden deneme eylemi. |
| **Sonuçlar / Nokta Tablosu** | Üretilen nokta sayısı, Z min/max/farklı değer sayısı, filtrelenebilir örnek satırlar ve haritaya dönme eylemi. |
| **Dışa Aktarma** | DAT koordinat modu seçimi (UTM veya WGS84), DAT/CSV oluşturma, dosya kaydetme ve Android paylaşım menüsünü açma. |
| **Ayarlar ve Yardım** | Birimler, DEM önbelleğini temizleme, veri formatı açıklamaları, Copernicus kullanımı ve sürüm bilgisi. |

## Ana kullanıcı akışları

### 1. Polygon çizerek grid üretme

Kullanıcı ana sayfada “Yeni ölçüm” düğmesine dokunur. Harita ekranında haritaya art arda dokunarak polygon köşelerini yerleştirir; son köşe, ilk köşeye yakın olduğunda alanı kapatma önerisi görünür. Kullanıcı “Alanı tamamla” düğmesine dokununca Grid Ayarları ekranına geçer. Ayarları kaydeder ve “Grid üret” düğmesine basar. Uygulama arka planda grid noktalarını oluşturur, seçili Copernicus karolarını hazırlar ve her noktayı DEM’den örnekler. İşlem tamamlanınca sonuç ekranı açılır.

### 2. Copernicus Z değerlerini kontrol etme

Sonuç ekranında kullanıcı nokta sayısını ve Z dağılımını görür. Özet kartında `min`, `max` ve `farklı değer` sayısı birlikte gösterilir. Tüm değerler aynıysa uygulama sessizce başarılı görünmek yerine uyarı verir ve DEM örnekleme durumunu açıklar. Kullanıcı “Haritada gör” ile noktaları renk skalasıyla inceleyebilir veya ayarlara dönüp yeniden üretebilir.

### 3. DAT/CSV dışa aktarma

Kullanıcı Sonuçlar ekranında “Dışa aktar” düğmesine dokunur. DAT için UTM metre veya WGS84 lon/lat seçer. Uygulama DAT ve/veya CSV dosyasını yerel uygulama klasörüne yazar, dosya adını gösterir ve Android paylaşım sayfasını açar. CSV; nokta kimliği, hat kimliği, UTM, lon/lat ve Z alanlarını içerir. DAT; X, Y, Z başlıklarını ve güncel nokta nesnelerindeki değerleri kullanır.

## Mobil yerleşim ve etkileşim ilkeleri

Tüm ekranlar portre 9:16 ve tek elle kullanım için tasarlanır. Kritik eylemler ekranın altındaki sabit güvenli alanda, ikincil eylemler üst çubukta bulunur. Harita tam ekranı kullanırken ayar ve sonuç özetleri bottom sheet olarak açılır. Form alanlarında büyük dokunma hedefleri, açık hata metinleri ve işlem sırasında iptal edilebilir ilerleme durumu kullanılır. iOS HIG ile uyumlu sade hiyerarşi korunurken Android’de Material ikonları ve sistem paylaşım davranışı tercih edilir.

## Renk seçimleri

| Token | Renk | Kullanım |
|---|---|---|
| **Surveyor lacivert** | `#102A43` | Başlıklar, üst çubuk, güven veren ana marka rengi |
| **Arazi teal** | `#0F766E` | Birincil butonlar, seçili polygon, aktif sekme |
| **DEM amber** | `#D97706` | Copernicus indirme/örnekleme durumu ve dikkat mesajları |
| **OSM mavi** | `#2563EB` | Harita düğmeleri, konum göstergesi ve harita etkileşimleri |
| **Harita açık zemin** | `#F7F9FC` | Ekran arka planı ve kartların çevresi |
| **Kart beyazı** | `#FFFFFF` | Yükseltilmiş yüzeyler |
| **Ana metin** | `#172B4D` | Birincil metin |
| **İkincil metin** | `#52606D` | Açıklamalar ve yardımcı bilgiler |
| **Başarı yeşili** | `#15803D` | Değişken Z değerleri ve tamamlanan işlemler |
| **Hata kırmızısı** | `#B42318` | DEM/alan/doğrulama hataları |

Z yoğunluk görselleştirmesinde düşük değerler `#2563EB`, orta değerler `#14B8A6`, yüksek değerler `#F59E0B` ve en yüksek değerler `#DC2626` ile gösterilir. Renk tek başına bilgi taşımaz; kritik sonuçlar sayısal etiketlerle de sunulur.

## Veri modeli sözlüğü

`SurveyProject`, polygon koordinatlarını, `SurveySettings` değerlerini, üretilen `SurveyPoint[]` listesini ve UTM EPSG kodunu içerir. Her `SurveyPoint`; `pointId`, `lineId`, `x`, `y`, `lon`, `lat` ve `z` alanlarını taşır. Copernicus örneklemesi tamamlanmadan dışa aktarma etkinleştirilmez. Sonuç ekranı her zaman Z min/max ve farklı değer sayısını hesaplanmış veriden üretir; sabit yer tutucu değer kullanılmaz.
