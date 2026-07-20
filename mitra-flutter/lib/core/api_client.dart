import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';

const String kBaseUrl = 'http://10.0.2.2:8000/api'; // Android emulator → localhost
// For real device: change to your machine's IP e.g. 'http://192.168.1.x:8000/api'

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(
    baseUrl: kBaseUrl,
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 30),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  ));

  // Interceptor for logging
  dio.interceptors.add(LogInterceptor(
    requestBody: false,
    responseBody: false,
    logPrint: (o) => debugPrint('[Dio] $o'),
  ));

  return dio;
});

final cookieJarProvider = FutureProvider<PersistCookieJar>((ref) async {
  final dir = await getApplicationDocumentsDirectory();
  return PersistCookieJar(
    ignoreExpires: true,
    storage: FileStorage('${dir.path}/.cookies/'),
  );
});

final apiClientProvider = Provider<Dio>((ref) {
  final dio = ref.watch(dioProvider);
  final cookieJarAsync = ref.watch(cookieJarProvider);

  cookieJarAsync.whenData((jar) {
    dio.interceptors.removeWhere((i) => i is CookieManager);
    dio.interceptors.add(CookieManager(jar));
  });

  // 401 refresh interceptor
  dio.interceptors.add(InterceptorsWrapper(
    onError: (error, handler) async {
      if (error.response?.statusCode == 401) {
        try {
          await dio.post('/auth/refresh');
          final opts = error.requestOptions;
          final response = await dio.request(
            opts.path,
            data: opts.data,
            queryParameters: opts.queryParameters,
            options: Options(method: opts.method, headers: opts.headers),
          );
          return handler.resolve(response);
        } catch (_) {
          return handler.next(error);
        }
      }
      return handler.next(error);
    },
  ));

  return dio;
});
